import { useState, useRef } from "react";
import { ImageIcon, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

interface ImageImportProps {
  onComplete: () => void;
}

function base64ToBlob(base64: string): Blob {
  // Remove data URI prefix if present
  const clean = base64.replace(/^data:image\/\w+;base64,/, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "image/jpeg" });
}

function detectExtension(base64: string): string {
  if (base64.startsWith("/9j/")) return "jpg";
  if (base64.startsWith("iVBOR")) return "png";
  if (base64.startsWith("R0lGO")) return "gif";
  if (base64.startsWith("UklGR")) return "webp";
  return "jpg";
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
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", codepage: 65001 });
      if (!wb.SheetNames.length) {
        setStatus("error");
        setMessage("Arquivo vazio ou sem planilhas.");
        return;
      }
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

      console.log("Image import: sheets:", wb.SheetNames, "rows:", rows.length);
      if (rows.length > 0) {
        console.log("Image import: first row keys:", Object.keys(rows[0]));
      }

      if (!rows.length) {
        setStatus("error");
        setMessage("Arquivo vazio ou formato inválido. Verifique se a primeira linha contém os cabeçalhos.");
        return;
      }

      // Identify columns
      const getField = (row: any, keys: string[]): string | undefined => {
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

      const total = rows.length;
      setProgress({ current: 0, total });
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const code = getField(row, ["codigoproduto", "codigo_produto", "codigo", "code", "sku"]);
        const imgBase64 = getField(row, ["imagem_base64", "imagem", "image_base64", "image", "base64"]);

        if (!code || !imgBase64) {
          errors.push(`Linha ${i + 2}: código ou imagem ausente`);
          skipped++;
          setProgress({ current: i + 1, total });
          continue;
        }

        // Find product by code
        const { data: products } = await supabase
          .from("products")
          .select("id")
          .eq("code", code)
          .limit(1);

        if (!products || products.length === 0) {
          errors.push(`Linha ${i + 2}: produto com código "${code}" não encontrado`);
          skipped++;
          setProgress({ current: i + 1, total });
          continue;
        }

        try {
          // Clean and upload
          const cleanBase64 = imgBase64.replace(/^data:image\/\w+;base64,/, "").replace(/\s/g, "");
          const ext = detectExtension(cleanBase64);
          const blob = base64ToBlob(cleanBase64);
          const path = `${crypto.randomUUID()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(path, blob, { contentType: `image/${ext}` });

          if (uploadError) {
            errors.push(`Linha ${i + 2}: erro no upload - ${uploadError.message}`);
            skipped++;
            setProgress({ current: i + 1, total });
            continue;
          }

          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);

          // Update product
          const { error: updateError } = await supabase
            .from("products")
            .update({ image_url: urlData.publicUrl })
            .eq("id", products[0].id);

          if (updateError) {
            errors.push(`Linha ${i + 2}: erro ao atualizar produto - ${updateError.message}`);
            skipped++;
          } else {
            updated++;
          }
        } catch {
          errors.push(`Linha ${i + 2}: imagem base64 inválida`);
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
    } catch {
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

      {status === "loading" && progress.total > 0 && (
        <div className="space-y-1">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {progress.current} / {progress.total} processados
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
