import { Router } from "express";
import pool from "../db";
import { requireAdmin } from "../middleware/auth";

export const settingsRouter = Router();

settingsRouter.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM store_settings");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

settingsRouter.put("/:key", requireAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    const { rowCount } = await pool.query(
      "UPDATE store_settings SET value = $1 WHERE key = $2",
      [value, req.params.key]
    );
    if (rowCount === 0) {
      await pool.query(
        "INSERT INTO store_settings (key, value) VALUES ($1, $2)",
        [req.params.key, value]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
