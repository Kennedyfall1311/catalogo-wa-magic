import { Router } from "express";
import pool from "../db";
import { requireAdmin } from "../middleware/auth";

export const sellersRouter = Router();

// Listar todos os vendedores
sellersRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sellers ORDER BY name");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar vendedor pelo slug
sellersRouter.get("/slug/:slug", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM sellers WHERE slug = $1 AND active = true LIMIT 1",
      [req.params.slug]
    );
    res.json(rows[0] || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Criar vendedor
sellersRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, slug, whatsapp } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO sellers (name, slug, whatsapp) VALUES ($1, $2, $3) RETURNING *",
      [name, slug, whatsapp || null]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar vendedor
sellersRouter.put("/:id", requireAdmin, async (req, res) => {
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
      `UPDATE sellers SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir vendedor
sellersRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM sellers WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
