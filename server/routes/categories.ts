import { Router } from "express";
import pool from "../db";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM categories ORDER BY name");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

categoriesRouter.post("/", async (req, res) => {
  try {
    const { name, slug } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *",
      [name, slug]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST batch insert
categoriesRouter.post("/batch", async (req, res) => {
  try {
    const cats = req.body.categories as { name: string; slug: string }[];
    const inserted = [];
    for (const c of cats) {
      const { rows } = await pool.query(
        "INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING RETURNING *",
        [c.name, c.slug]
      );
      if (rows[0]) inserted.push(rows[0]);
    }
    res.json(inserted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

categoriesRouter.put("/:id", async (req, res) => {
  try {
    const { name, slug } = req.body;
    const { rows } = await pool.query(
      "UPDATE categories SET name = $1, slug = $2 WHERE id = $3 RETURNING *",
      [name, slug, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

categoriesRouter.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM categories WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
