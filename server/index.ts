import express from "express";
import cors from "cors";
import path from "path";
import { productsRouter } from "./routes/products";
import { categoriesRouter } from "./routes/categories";
import { settingsRouter } from "./routes/settings";
import { bannersRouter } from "./routes/banners";
import { paymentConditionsRouter } from "./routes/payment-conditions";
import { uploadRouter } from "./routes/upload";
import { authRouter } from "./routes/auth";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// API routes
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/banners", bannersRouter);
app.use("/api/payment-conditions", paymentConditionsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/auth", authRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: "postgres" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
  console.log(`📦 Modo: PostgreSQL direto`);
});
