import { useState, useRef } from "react";
import { FileSpreadsheet, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { DbCategory } from "@/hooks/useDbProducts";
import type { TablesInsert } from "@/integrations/supabase/types";

const BATCH_SIZE = 500;

const ProductRowSchema = z.object({
  name: z.string().trim().min(1).max(255),
  code: z.string().max(100).nullable(),
  price: z.number().nonnegative().max(999999.99),
  original_price: z.number().positive().max(999999.99).nullable(),
  description: z.string().max(2000).trim(),
  image_url: z.string().max(500),
});

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalize(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\s]+/g, " ").trim();
}

function getField(row: any, possibleKeys: string[]): string | undefined {
  for (const key of Object.keys(row)) {
    const norm = normalize(key);
    for (const possible of possibleKeys) {
      if (norm === possible || norm.includes(possible)) {
        const val = row[key];
        return val != null ? String(val).trim() : undefined;
      }
    }
  }
  return undefined;
}

interface ExcelImportProps {
  categories: DbCategory[];
  onImport: (products: TablesInsert<"products">[]) => Promise<{ error: any }>;
  onRefreshCategories: () => void;
}

export function ExcelImport({ categories, onImport, onRefreshCategories }: ExcelImportProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("loading");
    setMessage("");

    try {
      const buffer = await file.arrayBuffer();
      let wb: XLSX.WorkBook;

      const isCSV = file.name.toLowerCase().endsWith(".csv");
      if (isCSV) {
        let text = new TextDecoder("utf-8").decode(buffer);
        const semicolons = (text.match(/;/g) || []).length;
        const commas = (text.match(/,/g) || []).length;
        if (semicolons > commas) {
          text = text.replace(/;/g, ",");
        }
        wb = XLSX.read(text, { type: "string" });
      } else {
        wb = XLSX.read(buffer, { type: "array", codepage: 65001 });
      }

      if (!wb.SheetNames.length) {
        setStatus("error");
        setMessage("Arquivo vazio ou sem planilhas.");
        return;
      }
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

      console.log("Excel import: sheets found:", wb.SheetNames, "rows:", rows.length);
      if (rows.length > 0) {
        console.log("Excel import: first row keys:", Object.keys(rows[0]));
        console.log("Excel import: first row sample:", JSON.stringify(rows[0]).slice(0, 500));
      }

      if (!rows.length) {
        setStatus("error");
        setMessage("Arquivo vazio ou formato inválido. Verifique se a primeira linha contém os cabeçalhos.");
        return;
      }



      // Collect unique category names from import
      const catNames = new Set<string>();
      rows.forEach((row) => {
        const cat = getField(row, ["categoria", "category", "categorias"]);
        if (cat) catNames.add(cat);
      });
      console.log("Categories found in file:", [...catNames]);

      // Create missing categories
      let allCategories = [...categories];
      if (catNames.size > 0) {
        const existingSlugs = new Set(categories.map((c) => c.slug));
        const newCats: { name: string; slug: string }[] = [];
        catNames.forEach((name) => {
          const slug = slugify(name);
          if (!existingSlugs.has(slug) && !categories.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
            newCats.push({ name, slug });
          }
        });

        if (newCats.length > 0) {
          const { data: inserted, error: catError } = await supabase.from("categories").insert(newCats).select();
          console.log("Category insert result:", { inserted, catError, newCats });
          if (catError) {
            setStatus("error");
            setMessage(`Erro ao criar categorias: ${catError.message}`);
            return;
          }
          if (inserted) allCategories = [...allCategories, ...inserted];
          onRefreshCategories();
        }
      }

      const validationErrors: string[] = [];
      const products: TablesInsert<"products">[] = [];

      rows.forEach((row, idx) => {
        const catName = getField(row, ["categoria", "category", "categorias"]);
        const catSlug = catName ? slugify(catName) : "";
        const cat = allCategories.find((c) => c.slug === catSlug || c.name.toLowerCase() === (catName?.toLowerCase() || ""));

        const nome = getField(row, ["nome", "name", "produto"]) || "";
        const codigo = getField(row, ["codigo", "code", "sku"]) || null;
        const preco = getField(row, ["preco", "price", "valor"]);
        const precoOriginal = getField(row, ["preco_original", "preco original", "original_price"]);
        const descricao = getField(row, ["descricao", "description", "desc"]) || "";
        const imagemUrl = getField(row, ["imagem_url", "imagem", "image_url", "image"]) || "/placeholder.svg";

        const parsed = ProductRowSchema.safeParse({
          name: nome,
          code: codigo,
          price: parseFloat(preco || "0") || 0,
          original_price: precoOriginal ? parseFloat(precoOriginal) : null,
          description: descricao,
          image_url: imagemUrl,
        });

        if (!parsed.success) {
          validationErrors.push(`Linha ${idx + 2}: ${parsed.error.issues.map(i => i.message).join(", ")}`);
          return;
        }

        products.push({
          name: parsed.data.name,
          code: parsed.data.code,
          slug: slugify(parsed.data.name),
          price: parsed.data.price,
          original_price: parsed.data.original_price,
          description: parsed.data.description,
          image_url: parsed.data.image_url,
          category_id: cat?.id || null,
          active: true,
        });
      });

      if (validationErrors.length > 0 && products.length === 0) {
        setStatus("error");
        setMessage(`Erros de validação:\n${validationErrors.slice(0, 5).join("\n")}`);
        return;
      }

      // Process in batches
      let imported = 0;
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        const { error } = await onImport(batch);
        if (error) {
          setStatus("error");
          setMessage(`Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}. ${imported} produtos importados antes do erro.`);
          return;
        }
        imported += batch.length;
        setMessage(`${imported} / ${products.length} produtos importados...`);
        // Yield to UI thread between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const warnings = validationErrors.length > 0 ? ` (${validationErrors.length} linhas ignoradas por erros)` : "";
      setStatus("success");
      setMessage(`${imported} produtos importados com sucesso!${warnings}`);
    } catch {
      setStatus("error");
      setMessage("Erro ao ler o arquivo. Verifique o formato.");
    }

    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { nome: "Produto Exemplo", codigo: "PROD001", preco: 99.90, preco_original: 129.90, descricao: "Descrição do produto", imagem_url: "", categoria: "roupas" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, "modelo-produtos.xlsx");
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5" />
        Importar Produtos por Excel
      </h2>
      <p className="text-xs text-muted-foreground">
        Colunas aceitas: <strong>nome</strong> | <strong>codigo</strong> | <strong>preco</strong> | <strong>preco_original</strong> | <strong>descricao</strong> | <strong>imagem_url</strong> | <strong>categoria</strong>
      </p>

      <div className="flex flex-wrap gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
          <FileSpreadsheet className="h-4 w-4" />
          {status === "loading" ? "Importando..." : "Importar Arquivo"}
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

      {message && (
        <p className={`text-sm ${status === "error" ? "text-destructive" : "text-whatsapp"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
