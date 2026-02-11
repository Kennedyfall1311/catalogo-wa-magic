import { useState, useRef } from "react";
import { ImageIcon, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { productsApi, storageApi } from "@/lib/api-client";

interface ImageImportProps {
  onComplete: () => void;
}

function detectExtension(base64: string): string {
  if (base64.startsWith("/9j/")) return "jpg";
  if (base64.startsWith("iVBOR")) return "png";
  if (base64.startsWith("R0lGO")) return "gif";
  if (base64.startsWith("UklGR")) return "webp";
  return "jpg";
}

/**
 * Streaming CSV parser that reads a File in small chunks via ReadableStream.
 */
async function* streamCSVRecords(
  file: File
): AsyncGenerator<Record<string, string>> {
  const CHUNK_SIZE = 4 * 1024 * 1024;
  const decoder = new TextDecoder("utf-8");

  let headers: string[] | null = null;
  let delimiter = ",";
  let currentField = "";
  let currentRecord: string[] = [];
  let inQuotes = false;
  let leftover = "";

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
    const start = chunkIdx * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const blob = file.slice(start, end);
    const buffer = await blob.arrayBuffer();
    const chunkText = decoder.decode(buffer, { stream: chunkIdx < totalChunks - 1 });

    let text: string;
    if (chunkIdx === 0) {
      text = chunkText.charCodeAt(0) === 0xFEFF ? chunkText.slice(1) : chunkText;
    } else {
      text = chunkText;
    }

    text = leftover + text;
    leftover = "";

    let i = 0;
    while (i < text.length) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            currentField += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        currentField += ch;
        i++;
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
        } else if (ch === delimiter) {
          currentRecord.push(currentField.trim());
          currentField = "";
          i++;
        } else if (ch === "\r") {
          i++;
        } else if (ch === "\n") {
          currentRecord.push(currentField.trim());
          currentField = "";

          if (currentRecord.some(f => f.length > 0)) {
            if (!headers) {
              const rawLine = currentRecord.join(delimiter);
              const delimiters = [",", ";", "\t", "|"];
              let maxCount = 0;
              for (const d of delimiters) {
                const count = rawLine.split(d).length - 1;
                if (count > maxCount) { maxCount = count; delimiter = d; }
              }
              headers = currentRecord.map(h => h.replace(/^"+|"+$/g, "").trim());
            } else {
              const row: Record<string, string> = {};
              headers.forEach((h, idx) => {
                row[h] = (currentRecord[idx] || "").replace(/^"+|"+$/g, "").trim();
              });
              yield row;
            }
          }
          currentRecord = [];
          i++;
        } else {
          currentField += ch;
          i++;
        }
      }
    }
  }

  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    if (headers && currentRecord.some(f => f.length > 0)) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = (currentRecord[idx] || "").replace(/^"+|"+$/g, "").trim();
      });
      yield row;
    }
  }
}

const getField = (row: Record<string, string>, keys: string[]): string | undefined => {
  for (const key of Object.keys(row)) {
    const norm = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    for (const k of keys) {
      if (norm === k || norm.includes(k)) {
        const val = row[key];
        return val != null ? String(val).trim() : undefined;
      }
    }
  }
  return undefined;
};

async function processRow(
  row: Record<string, string>,
  rowNum: number
): Promise<{ success: boolean; error?: string }> {
  const code = getField(row, ["codigoproduto", "codigo_produto", "codigo", "code", "sku"]);
  const imgBase64 = getField(row, ["imagem_base64", "imagem", "image_base64", "image", "base64"]);

  if (!code || !imgBase64) {
    return { success: false, error: `Linha ${rowNum}: código ou imagem ausente` };
  }

  const products = await productsApi.findByCode(code);

  if (!products || products.length === 0) {
    return { success: false, error: `Linha ${rowNum}: produto com código "${code}" não encontrado` };
  }

  try {
    const cleanBase64 = imgBase64.replace(/^data:image\/\w+;base64,/, "").replace(/\s/g, "");
    const { url, error: uploadError } = await storageApi.uploadBase64(cleanBase64);

    if (uploadError || !url) {
      return { success: false, error: `Linha ${rowNum}: erro no upload - ${uploadError?.message || "unknown"}` };
    }

    const { error: updateError } = await productsApi.update(products[0].id, { image_url: url });

    if (updateError) {
      return { success: false, error: `Linha ${rowNum}: erro ao atualizar produto - ${updateError.message}` };
    }

    return { success: true };
  } catch {
    return { success: false, error: `Linha ${rowNum}: imagem base64 inválida` };
  }
}

export function ImageImport({ onComplete }: ImageImportProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("loading");
    setMessage("");
    setProgress({ current: 0, total: 0 });

    try {
      const isCSV = file.name.toLowerCase().endsWith(".csv");

      if (isCSV) {
        let updated = 0;
        let skipped = 0;
        let rowNum = 1;
        const errors: string[] = [];

        for await (const row of streamCSVRecords(file)) {
          rowNum++;
          const result = await processRow(row, rowNum);
          if (result.success) {
            updated++;
          } else {
            if (result.error) errors.push(result.error);
            skipped++;
          }
          setProgress({ current: rowNum - 1, total: 0 });
        }

        if (updated > 0) {
          onComplete();
          const warn = skipped > 0 ? ` (${skipped} linhas ignoradas)` : "";
          setStatus("success");
          setMessage(`${updated} imagens atualizadas com sucesso!${warn}`);
        } else {
          setStatus("error");
          setMessage(
            `Nenhuma imagem atualizada.\n${errors.slice(0, 5).join("\n")}${
              errors.length > 5 ? `\n...e mais ${errors.length - 5} erros` : ""
            }`
          );
        }
      } else {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array", codepage: 65001 });
        if (!wb.SheetNames.length) {
          setStatus("error");
          setMessage("Arquivo vazio ou sem planilhas.");
          return;
        }
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

        if (!rows.length) {
          setStatus("error");
          setMessage("Arquivo vazio ou formato inválido.");
          return;
        }

        const total = rows.length;
        setProgress({ current: 0, total });
        let updated = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
          const result = await processRow(rows[i], i + 2);
          if (result.success) {
            updated++;
          } else {
            if (result.error) errors.push(result.error);
            skipped++;
          }
          setProgress({ current: i + 1, total });
        }

        if (updated > 0) {
          onComplete();
          const warn = skipped > 0 ? ` (${skipped} linhas ignoradas)` : "";
          setStatus("success");
          setMessage(`${updated} imagens atualizadas com sucesso!${warn}`);
        } else {
          setStatus("error");
          setMessage(
            `Nenhuma imagem atualizada.\n${errors.slice(0, 5).join("\n")}${
              errors.length > 5 ? `\n...e mais ${errors.length - 5} erros` : ""
            }`
          );
        }
      }
    } catch (err) {
      console.error("Image import error:", err);
      setStatus("error");
      setMessage("Erro ao ler o arquivo. Verifique o formato.");
    }

    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { codigoproduto: "PROD001", imagem_base64: "/9j/4AAQ... (base64 da imagem)" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Imagens");
    XLSX.writeFile(wb, "modelo-imagens.xlsx");
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <ImageIcon className="h-5 w-5" />
        Importar Imagens por Base64
      </h2>
      <p className="text-xs text-muted-foreground">
        Colunas aceitas: <strong>codigoproduto</strong> | <strong>imagem_base64</strong>
        <br />
        O sistema localiza o produto pelo código e faz upload da imagem para o storage.
      </p>

      <div className="flex flex-wrap gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
          <ImageIcon className="h-4 w-4" />
          {status === "loading" ? "Processando..." : "Importar Imagens"}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv,.xls"
            onChange={handleFile}
            className="hidden"
            disabled={status === "loading"}
          />
        </label>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition"
        >
          <Download className="h-4 w-4" />
          Baixar Modelo
        </button>
      </div>

      {status === "loading" && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {progress.total > 0
              ? `${progress.current} / ${progress.total} processados`
              : `${progress.current} processados...`}
          </p>
        </div>
      )}

      {message && (
        <p className={`text-sm whitespace-pre-line ${status === "error" ? "text-destructive" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
