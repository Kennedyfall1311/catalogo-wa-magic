import { Router } from "express";
import pool from "../db";

export const productsRouter = Router();

// GET all products
productsRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET product by slug
productsRouter.get("/slug/:slug", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products WHERE slug = $1 AND active = true LIMIT 1",
      [req.params.slug]
    );
    res.json(rows[0] || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET product by code
productsRouter.get("/code/:code", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id FROM products WHERE code = $1 LIMIT 1",
      [req.params.code]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product
productsRouter.post("/", async (req, res) => {
  try {
    const { name, code, slug, price, original_price, description, image_url, category_id, active } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO products (name, code, slug, price, original_price, description, image_url, category_id, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, code, slug, price, original_price || null, description || "", image_url || "/placeholder.svg", category_id || null, active ?? true]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
productsRouter.put("/:id", async (req, res) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (key === "id" || key === "created_at" || key === "updated_at") continue;
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
      `UPDATE products SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
productsRouter.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST upsert products (batch)
productsRouter.post("/upsert", async (req, res) => {
  const products = req.body.products as any[];
  if (!Array.isArray(products)) {
    res.status(400).json({ error: "products array required" });
    return;
  }

  try {
    for (const p of products) {
      await pool.query(
        `INSERT INTO products (name, code, slug, price, original_price, description, image_url, category_id, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           price = EXCLUDED.price,
           original_price = EXCLUDED.original_price,
           description = EXCLUDED.description,
           image_url = CASE WHEN EXCLUDED.image_url = '/placeholder.svg' THEN products.image_url ELSE EXCLUDED.image_url END,
           category_id = EXCLUDED.category_id,
           active = EXCLUDED.active`,
        [p.name, p.code, p.slug, p.price, p.original_price || null, p.description || "", p.image_url || "/placeholder.svg", p.category_id || null, p.active ?? true]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
