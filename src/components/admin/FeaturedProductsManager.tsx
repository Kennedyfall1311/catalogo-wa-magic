import { useState, useMemo } from "react";
import { Star, Search, GripVertical, X, ArrowUp, ArrowDown } from "lucide-react";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";

interface Props {
  products: DbProduct[];
  categories: DbCategory[];
  onUpdateProduct: (id: string, data: Partial<DbProduct>) => Promise<any>;
}

export function FeaturedProductsManager({ products, categories, onUpdateProduct }: Props) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const featuredProducts = useMemo(
    () =>
      products
        .filter((p) => p.featured)
        .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0)),
    [products]
  );

  const availableProducts = useMemo(() => {
    return products
      .filter((p) => !p.featured && p.active)
      .filter((p) => !filterCat || p.category_id === filterCat)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.code ?? "").toLowerCase().includes(search.toLowerCase()));
  }, [products, search, filterCat]);

  const addFeatured = async (product: DbProduct) => {
    const maxOrder = featuredProducts.length > 0
      ? Math.max(...featuredProducts.map((p) => p.featured_order ?? 0))
      : 0;
    await onUpdateProduct(product.id, { featured: true, featured_order: maxOrder + 1 } as any);
  };

  const removeFeatured = async (product: DbProduct) => {
    await onUpdateProduct(product.id, { featured: false, featured_order: 0 } as any);
  };

  const moveUp = async (product: DbProduct, index: number) => {
    if (index === 0) return;
    const prev = featuredProducts[index - 1];
    await Promise.all([
      onUpdateProduct(product.id, { featured_order: prev.featured_order } as any),
      onUpdateProduct(prev.id, { featured_order: product.featured_order } as any),
    ]);
  };

  const moveDown = async (product: DbProduct, index: number) => {
    if (index >= featuredProducts.length - 1) return;
    const next = featuredProducts[index + 1];
    await Promise.all([
      onUpdateProduct(product.id, { featured_order: next.featured_order } as any),
      onUpdateProduct(next.id, { featured_order: product.featured_order } as any),
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Featured list */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Produtos em destaque ({featuredProducts.length})
        </p>
        {featuredProducts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border rounded-lg bg-muted/30">
            Nenhum produto em destaque. Adicione produtos abaixo.
          </p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {featuredProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <img src={p.image_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded object-cover bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.code ?? ""}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => moveUp(p, i)} disabled={i === 0} className="p-1 hover:bg-muted rounded disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveDown(p, i)} disabled={i === featuredProducts.length - 1} className="p-1 hover:bg-muted rounded disabled:opacity-30">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => removeFeatured(p)} className="p-1 hover:bg-muted rounded text-destructive">
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
        <p className="text-xs font-medium text-muted-foreground">Adicionar produtos ao destaque</p>
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
              onClick={() => addFeatured(p)}
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
              <Star className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
