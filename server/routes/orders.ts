import { Router } from "express";
import pool from "../db";
import { requireAdmin } from "../middleware/auth";

export const ordersRouter = Router();

/**
 * VENDAS 100% INTERNAS
 * Todo o ciclo de venda (criação, consulta, status, exclusão e métricas)
 * acontece neste backend + banco próprio. Nenhuma API externa é chamada.
 */

// ─── Idempotência em memória (evita pedido duplicado em duplo clique/retry) ───
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const idempotencyStore = new Map<string, { orderId: string; at: number }>();

function getIdempotent(key: string) {
  const hit = idempotencyStore.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > IDEMPOTENCY_TTL_MS) {
    idempotencyStore.delete(key);
    return null;
  }
  return hit.orderId;
}

// ─── Listar pedidos (filtros opcionais: status, seller_id, from, to) ───
ordersRouter.get("/", async (req, res) => {
  try {
    const { status, seller_id, from, to } = req.query as Record<string, string>;
    const where: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (status) { where.push(`status = $${i++}`); values.push(status); }
    if (seller_id) { where.push(`seller_id = $${i++}`); values.push(seller_id); }
    if (from) { where.push(`created_at >= $${i++}`); values.push(from); }
    if (to) { where.push(`created_at <= $${i++}`); values.push(to); }

    const { rows } = await pool.query(
      `SELECT * FROM orders ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC`,
      values
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Resumo de vendas (dashboard) ───
ordersRouter.get("/stats/summary", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int                                              AS total_orders,
        COALESCE(SUM(total), 0)::numeric                           AS total_revenue,
        COALESCE(AVG(total), 0)::numeric                           AS average_ticket,
        COUNT(*) FILTER (WHERE status = 'pending')::int            AS pending_orders,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS orders_today
      FROM orders
    `);
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Detalhe de um pedido (com itens) ───
ordersRouter.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
    if (!rows[0]) {
      res.status(404).json({ error: "Pedido não encontrado" });
      return;
    }
    const items = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [req.params.id]);
    res.json({ ...rows[0], items: items.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Itens de um pedido ───
ordersRouter.get("/:id/items", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at",
      [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Criar pedido com itens (transação + baixa de estoque) ───
ordersRouter.post("/", async (req, res) => {
  const idempotencyKey = (req.headers["x-idempotency-key"] as string) || "";
  if (idempotencyKey) {
    const existing = getIdempotent(idempotencyKey);
    if (existing) {
      const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [existing]);
      res.json(rows[0] ?? { id: existing });
      return;
    }
  }

  const { order, items } = req.body ?? {};
  if (!order || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Payload inválido: envie { order, items[] }" });
    return;
  }
  if (!order.customer_name || !order.customer_phone) {
    res.status(400).json({ error: "customer_name e customer_phone são obrigatórios" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO orders (customer_name, customer_phone, customer_cpf_cnpj, payment_method, notes, subtotal, shipping_fee, total, status, seller_id, seller_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        order.customer_name,
        order.customer_phone,
        order.customer_cpf_cnpj || null,
        order.payment_method || null,
        order.notes || null,
        order.subtotal || 0,
        order.shipping_fee || 0,
        order.total || 0,
        order.status || "pending",
        order.seller_id || null,
        order.seller_name || null,
      ]
    );

    const createdOrder = rows[0];

    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_code, unit_price, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          createdOrder.id,
          item.product_id || null,
          item.product_name,
          item.product_code || null,
          item.unit_price,
          qty,
          item.total_price,
        ]
      );

      // Baixa de estoque interna (sem trigger, funciona em qualquer PostgreSQL)
      if (item.product_id) {
        await client.query(
          `UPDATE products SET quantity = GREATEST(0, COALESCE(quantity, 0) - $1) WHERE id = $2`,
          [qty, item.product_id]
        );
      }
    }

    await client.query("COMMIT");
    if (idempotencyKey) idempotencyStore.set(idempotencyKey, { orderId: createdOrder.id, at: Date.now() });
    res.status(201).json(createdOrder);
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── Atualizar pedido (ex: status) ───
ordersRouter.put("/:id", requireAdmin, async (req, res) => {
  try {
    const allowed = [
      "status", "customer_name", "customer_phone", "customer_cpf_cnpj",
      "payment_method", "notes", "subtotal", "shipping_fee", "total",
      "seller_id", "seller_name",
    ];
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body ?? {})) {
      if (!allowed.includes(key)) continue;
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    if (fields.length === 0) {
      res.status(400).json({ error: "Nenhum campo válido para atualizar" });
      return;
    }

    fields.push(`updated_at = now()`);
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE orders SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Pedido não encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Excluir pedido (itens saem em cascata) ───
ordersRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM orders WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
