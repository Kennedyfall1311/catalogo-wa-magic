import { useState } from "react";
import { Upload, Search, ImageOff } from "lucide-react";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";

interface Props {
  products: DbProduct[];
  categories: DbCategory[];
  onUploadImage: (file: File) => Promise<{ url: string | null; error: any }>;
  onUpdateProduct: (id: string, data: any) => Promise<{ error: any }>;
}

export function ProductsWithoutPhoto({ products, categories, onUploadImage, onUpdateProduct }: Props) {
  const [search, setSearch] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const noPhoto = products.filter(
    (p) => !p.image_url || p.image_url === "/placeholder.svg" || p.image_url.trim() === ""
  );

  const filtered = noPhoto.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUpload = async (productId: string, file: File) => {
    setUploadingId(productId);
    const { url } = await onUploadImage(file);
    if (url) {
      await onUpdateProduct(productId, { image_url: url });
    }
    setUploadingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageOff className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-bold">Produtos sem foto</h2>
        <span className="ml-auto rounded-full bg-destructive/10 px-3 py-0.5 text-sm font-semibold text-destructive">
          {noPhoto.length}
        </span>
      </div>

      {noPhoto.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">🎉 Todos os produtos possuem foto!</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-muted/50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filtered.map((p) => {
              const cat = categories.find((c) => c.id === p.category_id);
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ImageOff className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.code && <span>{p.code} · </span>}
                      R$ {Number(p.price).toFixed(2).replace(".", ",")}
                      {cat && ` · ${cat.name}`}
                    </p>
                  </div>
                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border bg-muted/50 px-3 py-2 text-xs font-medium hover:bg-muted transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingId === p.id ? "Enviando..." : "Foto"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingId === p.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(p.id, file);
                      }}
                    />
                  </label>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Nenhum produto encontrado com esse filtro.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
