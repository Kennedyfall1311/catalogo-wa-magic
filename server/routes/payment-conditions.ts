import { Router } from "express";
import pool from "../db";
import { requireAdmin } from "../middleware/auth";

export const paymentConditionsRouter = Router();

paymentConditionsRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM payment_conditions ORDER BY sort_order ASC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

paymentConditionsRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO payment_conditions (name, sort_order) VALUES ($1, $2) RETURNING *",
      [name, sort_order || 0]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

paymentConditionsRouter.put("/:id", requireAdmin, async (req, res) => {
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
      `UPDATE payment_conditions SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

paymentConditionsRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM payment_conditions WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
