import { Router } from "express";
import pool from "../db";
import { requireAdmin } from "../middleware/auth";

export const bannersRouter = Router();

bannersRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM banners ORDER BY sort_order ASC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

bannersRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const { image_url, link, sort_order } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO banners (image_url, link, sort_order) VALUES ($1, $2, $3) RETURNING *",
      [image_url, link || null, sort_order || 0]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

bannersRouter.put("/:id", requireAdmin, async (req, res) => {
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
      `UPDATE banners SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

bannersRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM banners WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
