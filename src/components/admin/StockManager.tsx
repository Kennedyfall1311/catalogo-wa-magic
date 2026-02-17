import { useState, useMemo } from "react";
import { Package, Search, Eye, EyeOff, Save, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";

interface StockManagerProps {
  products: DbProduct[];
  categories: DbCategory[];
  onUpdateProduct: (id: string, data: Partial<DbProduct>) => Promise<any>;
  hideOutOfStock: boolean;
  onToggleHideOutOfStock: (value: string) => void;
}

export function StockManager({ products, categories, onUpdateProduct, hideOutOfStock, onToggleHideOutOfStock }: StockManagerProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q));
      })
      .filter((p) => !filterCategory || p.category_id === filterCategory)
      .filter((p) => {
        if (stockFilter === "in_stock") return p.quantity != null && p.quantity > 0;
        if (stockFilter === "out_of_stock") return p.quantity == null || p.quantity <= 0;
        return true;
      })
      .sort((a, b) => {
        const qA = a.quantity ?? -1;
        const qB = b.quantity ?? -1;
        return qA - qB;
      });
  }, [products, search, filterCategory, stockFilter]);

  const totalProducts = products.length;
  const outOfStock = products.filter((p) => p.quantity == null || p.quantity <= 0).length;
  const lowStock = products.filter((p) => p.quantity != null && p.quantity > 0 && p.quantity <= 5).length;

  const handleSaveQuantity = async (id: string) => {
    setSaving(true);
    const qty = editValue === "" ? null : Number(editValue);
    await onUpdateProduct(id, { quantity: qty } as any);
    setEditingId(null);
    setSaving(false);
  };

  const getCategoryName = (catId: string | null) => categories.find((c) => c.id === catId)?.name || "—";

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold">{totalProducts}</p>
          <p className="text-[11px] text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{outOfStock}</p>
          <p className="text-[11px] text-muted-foreground">Sem estoque</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
          <p className="text-[11px] text-muted-foreground">Estoque baixo</p>
        </div>
      </div>

      {/* Hide out of stock toggle */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          {hideOutOfStock ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">Ocultar produtos sem estoque</p>
            <p className="text-[11px] text-muted-foreground">Produtos com estoque 0 ou vazio não aparecem no catálogo</p>
          </div>
        </div>
        <Switch
          checked={hideOutOfStock}
          onCheckedChange={(checked) => onToggleHideOutOfStock(checked ? "true" : "false")}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select
          value={filterCategory || ""}
          onChange={(e) => setFilterCategory(e.target.value || null)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Todas categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Todos</option>
          <option value="in_stock">Com estoque</option>
          <option value="out_of_stock">Sem estoque</option>
        </select>
      </div>

      {/* Product list */}
      <div className="space-y-1">
        {filtered.map((p) => {
          const qty = p.quantity;
          const isOut = qty == null || qty <= 0;
          const isLow = qty != null && qty > 0 && qty <= 5;
          const isEditing = editingId === p.id;

          return (
            <div key={p.id} className={`flex items-center gap-3 rounded-lg border bg-card p-2.5 ${isOut ? "opacity-60" : ""}`}>
              <img
                src={p.image_url || "/placeholder.svg"}
                alt={p.name}
                className="h-10 w-10 rounded-md object-cover bg-muted shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.code && <span>{p.code} · </span>}
                  {getCategoryName(p.category_id)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 w-20 text-sm text-center"
                      min="0"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveQuantity(p.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => handleSaveQuantity(p.id)}
                      disabled={saving}
                      className="rounded-full p-1.5 hover:bg-muted transition-colors text-primary"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setEditValue(qty != null ? String(qty) : "");
                    }}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium border transition-colors hover:bg-muted ${
                      isOut
                        ? "border-destructive/30 text-destructive"
                        : isLow
                        ? "border-yellow-500/30 text-yellow-600"
                        : "border-border text-foreground"
                    }`}
                  >
                    {isOut && <AlertTriangle className="h-3 w-3" />}
                    <Package className="h-3 w-3" />
                    <span>{qty != null ? qty : "—"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhum produto encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
