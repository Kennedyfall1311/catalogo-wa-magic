import { useState, useMemo } from "react";
import { Search, X, Plus } from "lucide-react";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";

interface Props {
  products: DbProduct[];
  categories: DbCategory[];
  fieldName: string; // "quick_filter_1" or "quick_filter_2"
  onUpdateProduct: (id: string, data: Partial<DbProduct>) => Promise<any>;
}

export function QuickFilterProductSelector({ products, categories, fieldName, onUpdateProduct }: Props) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const selectedProducts = useMemo(
    () => products.filter((p) => (p as any)[fieldName] === true),
    [products, fieldName]
  );

  const availableProducts = useMemo(() => {
    return products
      .filter((p) => !(p as any)[fieldName] && p.active)
      .filter((p) => !filterCat || p.category_id === filterCat)
      .filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code ?? "").toLowerCase().includes(search.toLowerCase())
      );
  }, [products, search, filterCat, fieldName]);

  const addProduct = async (product: DbProduct) => {
    await onUpdateProduct(product.id, { [fieldName]: true } as any);
  };

  const removeProduct = async (product: DbProduct) => {
    await onUpdateProduct(product.id, { [fieldName]: false } as any);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Produtos selecionados ({selectedProducts.length})
        </p>
        {selectedProducts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center border rounded-lg bg-muted/30">
            Nenhum produto selecionado. Adicione abaixo.
          </p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <img src={p.image_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded object-cover bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.code ?? ""}</p>
                </div>
                <button onClick={() => removeProduct(p)} className="p-1 hover:bg-muted rounded text-destructive shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Adicionar produtos</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou código..."
              className="w-full rounded-lg border bg-muted/50 pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={filterCat ?? ""}
            onChange={(e) => setFilterCat(e.target.value || null)}
            className="rounded-lg border bg-muted/50 px-2 py-1.5 text-xs outline-none"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1 max-h-40 overflow-y-auto">
          {availableProducts.slice(0, 30).map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              className="flex items-center gap-2 w-full rounded-lg border px-3 py-2 hover:bg-muted/50 transition text-left"
            >
              <img src={p.image_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded object-cover bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {p.code && `${p.code} · `}
                  {categories.find((c) => c.id === p.category_id)?.name ?? "Sem categoria"}
                </p>
              </div>
              <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          ))}
          {availableProducts.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhum produto encontrado</p>
          )}
          {availableProducts.length > 30 && (
            <p className="text-xs text-muted-foreground text-center py-1">
              Mostrando 30 de {availableProducts.length} — refine a busca
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
