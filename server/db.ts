import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/catalogo",
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

export default pool;
