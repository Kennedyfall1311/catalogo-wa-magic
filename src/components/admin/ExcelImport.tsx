import { useState, useRef } from "react";
import { FileSpreadsheet, Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { DbCategory } from "@/hooks/useDbProducts";
import type { TablesInsert } from "@/integrations/supabase/types";

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface ExcelImportProps {
  categories: DbCategory[];
  onImport: (products: TablesInsert<"products">[]) => Promise<{ error: any }>;
}

export function ExcelImport({ categories, onImport }: ExcelImportProps) {
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
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws);

      if (!rows.length) {
        setStatus("error");
        setMessage("Arquivo vazio ou formato inválido.");
        return;
      }

      const products: TablesInsert<"products">[] = rows.map((row) => {
        const catSlug = row.categoria?.toString().toLowerCase().trim();
        const cat = categories.find((c) => c.slug === catSlug || c.name.toLowerCase() === catSlug);

        return {
          name: row.nome?.toString() || "Sem nome",
          code: row.codigo?.toString() || null,
          slug: slugify(row.nome?.toString() || "sem-nome"),
          price: parseFloat(row.preco) || 0,
          original_price: row.preco_original ? parseFloat(row.preco_original) : null,
          description: row.descricao?.toString() || "",
          image_url: row.imagem_url?.toString() || "/placeholder.svg",
          category_id: cat?.id || null,
          active: true,
        };
      });

      const { error } = await onImport(products);
      if (error) {
        setStatus("error");
        setMessage(`Erro: ${error.message}`);
      } else {
        setStatus("success");
        setMessage(`${products.length} produtos importados com sucesso!`);
      }
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
