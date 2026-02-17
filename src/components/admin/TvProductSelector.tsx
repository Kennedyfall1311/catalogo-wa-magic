import { useState, useMemo } from "react";
import { Search, X, Monitor, ArrowUp, ArrowDown } from "lucide-react";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";

interface Props {
  products: DbProduct[];
  categories: DbCategory[];
  selectedIds: string[];
  onChangeIds: (ids: string[]) => void;
}

export function TvProductSelector({ products, categories, selectedIds, onChangeIds }: Props) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as DbProduct[];
  }, [selectedIds, products]);

  const availableProducts = useMemo(() => {
    return products
      .filter((p) => p.active && !selectedIds.includes(p.id))
      .filter((p) => !filterCat || p.category_id === filterCat)
      .filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code ?? "").toLowerCase().includes(search.toLowerCase())
      );
  }, [products, selectedIds, search, filterCat]);

  const addProduct = (product: DbProduct) => {
    onChangeIds([...selectedIds, product.id]);
  };

  const removeProduct = (id: string) => {
    onChangeIds(selectedIds.filter((sid) => sid !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newIds = [...selectedIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    onChangeIds(newIds);
  };

  const moveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    const newIds = [...selectedIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    onChangeIds(newIds);
  };

  return (
    <div className="space-y-4">
      {/* Selected list */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Produtos selecionados ({selectedProducts.length})
        </p>
        {selectedProducts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border rounded-lg bg-muted/30">
            Nenhum produto selecionado. Adicione produtos abaixo.
          </p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {selectedProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <img src={p.image_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded object-cover bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.code ?? ""}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1 hover:bg-muted rounded disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveDown(i)} disabled={i === selectedProducts.length - 1} className="p-1 hover:bg-muted rounded disabled:opacity-30">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => removeProduct(p.id)} className="p-1 hover:bg-muted rounded text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add products */}
      <div className="border-t pt-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Adicionar produtos ao Modo TV</p>
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

        <div className="space-y-1 max-h-48 overflow-y-auto">
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
              <Monitor className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
