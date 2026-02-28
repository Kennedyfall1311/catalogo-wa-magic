import { Router } from "express";
import pool from "../db";
import { requireAdmin } from "../middleware/auth";

export const ordersRouter = Router();

// Listar todos os pedidos
ordersRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar itens de um pedido
ordersRouter.get("/:id/items", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1",
      [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Criar pedido com itens (transação)
ordersRouter.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { order, items } = req.body;

    if (!order || !Array.isArray(items)) {
      res.status(400).json({ error: "Payload inválido: envie { order, items[] }" });
      return;
    }
      `INSERT INTO orders (customer_name, customer_phone, customer_cpf_cnpj, payment_method, notes, subtotal, shipping_fee, total, seller_id, seller_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        order.customer_name, order.customer_phone,
        order.customer_cpf_cnpj || null, order.payment_method || null,
        order.notes || null, order.subtotal || 0,
        order.shipping_fee || 0, order.total || 0,
        order.seller_id || null, order.seller_name || null
      ]
    );

    const createdOrder = rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_code, unit_price, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          createdOrder.id, item.product_id || null,
          item.product_name, item.product_code || null,
          item.unit_price, item.quantity || 1, item.total_price
        ]
      );
    }

    await client.query("COMMIT");
    res.json(createdOrder);
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Atualizar pedido (ex: status)
ordersRouter.put("/:id", requireAdmin, async (req, res) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (key === "id" || key === "created_at") continue;
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE orders SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir pedido
ordersRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM orders WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
