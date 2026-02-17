import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin } from "../middleware/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${crypto.randomUUID()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não permitido"));
    }
  },
});

export const uploadRouter = Router();

// Upload single image
uploadRouter.post("/image", requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Nenhum arquivo enviado" });
    return;
  }

  const port = process.env.PORT || 3001;
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  res.json({ url });
});

// Upload base64 image
uploadRouter.post("/base64", requireAdmin, (req, res) => {
  try {
    const { base64, filename } = req.body;
    if (!base64) {
      res.status(400).json({ error: "base64 data required" });
      return;
    }

    const clean = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(clean, "base64");

    // Detect extension
    let ext = "jpg";
    if (clean.startsWith("iVBOR")) ext = "png";
    else if (clean.startsWith("R0lGO")) ext = "gif";
    else if (clean.startsWith("UklGR")) ext = "webp";

    const name = filename || `${crypto.randomUUID()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, name);
    fs.writeFileSync(filePath, buffer);

    const port = process.env.PORT || 3001;
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;
    const url = `${baseUrl}/uploads/${name}`;

    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
