import { useState, useMemo, useCallback } from "react";
import { Eye, EyeOff, Pencil, Trash2, Search, Upload, ImageOff, Plus, CheckSquare, Square, FolderSync } from "lucide-react";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";
import { toast } from "@/hooks/use-toast";

interface Props {
  products: DbProduct[];
  categories: DbCategory[];
  onEdit: (product: DbProduct) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onUploadImage: (file: File) => Promise<{ url: string | null; error: any }>;
  onUpdateProduct: (id: string, data: any) => Promise<{ error: any }>;
  onAddNew: () => void;
  showForm: boolean;
  formSlot?: React.ReactNode;
}

export function ProductManager({
  products, categories, onEdit, onDelete, onToggleActive,
  onUploadImage, onUpdateProduct, onAddNew, showForm, formSlot,
}: Props) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("");
  const [hideNoPhoto, setHideNoPhoto] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const PAGE_SIZE = 50;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>("");
  const [applyingBulk, setApplyingBulk] = useState(false);

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q)));
    }
    if (catFilter) {
      list = list.filter((p) => p.category_id === catFilter);
    }
    if (hideNoPhoto) {
      list = list.filter((p) => p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== "");
    }
    return list;
  }, [products, search, catFilter, hideNoPhoto]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const noPhotoCount = products.filter(
    (p) => !p.image_url || p.image_url === "/placeholder.svg" || p.image_url.trim() === ""
  ).length;

  const hasPhoto = (p: DbProduct) =>
    p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== "";

  const handleQuickUpload = async (productId: string, file: File) => {
    setUploadingId(productId);
    const { url } = await onUploadImage(file);
    if (url) await onUpdateProduct(productId, { image_url: url });
    setUploadingId(null);
  };

  const resetPagination = () => setVisibleCount(PAGE_SIZE);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }, [filtered, selectedIds.size]);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBulkCategory("");
  };

  const handleBulkCategoryApply = async () => {
    if (selectedIds.size === 0) return;
    setApplyingBulk(true);
    const categoryId = bulkCategory || null;
    let successCount = 0;
    for (const id of selectedIds) {
      const { error } = await onUpdateProduct(id, { category_id: categoryId });
      if (!error) successCount++;
    }
    toast({
      title: "Categoria atualizada!",
      description: `${successCount} produto(s) alterado(s).`,
    });
    setApplyingBulk(false);
    exitSelectionMode();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{filtered.length} Produtos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
              selectionMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            {selectionMode ? "Cancelar" : "Selecionar"}
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> Novo
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectionMode && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            {selectedIds.size === filtered.length ? (
              <><CheckSquare className="h-3.5 w-3.5" /> Desmarcar todos</>
            ) : (
              <><Square className="h-3.5 w-3.5" /> Selecionar todos ({filtered.length})</>
            )}
          </button>

          <span className="text-xs font-semibold text-primary">
            {selectedIds.size} selecionado(s)
          </span>

          <div className="flex flex-1 items-center gap-2 min-w-0">
            <FolderSync className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="flex-1 min-w-0 rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={handleBulkCategoryApply}
              disabled={selectedIds.size === 0 || applyingBulk}
              className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              {applyingBulk ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
        </div>
      )}

      {showForm && formSlot}

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPagination(); }}
            className="w-full rounded-lg border bg-muted/50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); resetPagination(); }}
            className="rounded-lg border bg-muted/50 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => { setHideNoPhoto((v) => !v); resetPagination(); }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              hideNoPhoto ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageOff className="h-3.5 w-3.5" />
            {hideNoPhoto ? `Sem foto ocultos (${noPhotoCount})` : `Ocultar sem foto (${noPhotoCount})`}
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-2 max-h-[65vh] overflow-y-auto">
        {visible.map((p) => {
          const cat = categories.find((c) => c.id === p.category_id);
          const productHasPhoto = hasPhoto(p);
          const isSelected = selectedIds.has(p.id);
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                isSelected ? "bg-primary/5 border-primary/30" : "bg-card"
              }`}
              onClick={selectionMode ? () => toggleSelect(p.id) : undefined}
              style={selectionMode ? { cursor: "pointer" } : undefined}
            >
              {selectionMode && (
                <div className="shrink-0">
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-primary" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
              {productHasPhoto ? (
                <img
                  src={p.image_url!}
                  alt={p.name}
                  className="h-12 w-12 rounded-md object-cover bg-muted shrink-0"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  <ImageOff className="h-5 w-5 text-muted-foreground/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${!p.active ? "opacity-50" : ""}`}>
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.code && <span>{p.code} · </span>}
                  R$ {Number(p.price).toFixed(2).replace(".", ",")}
                  {cat && ` · ${cat.name}`}
                </p>
              </div>
              {!selectionMode && (
                <div className="flex items-center gap-1 shrink-0">
                  {!productHasPhoto && (
                    <label className="flex cursor-pointer items-center gap-1 rounded-full p-2 hover:bg-muted transition-colors text-primary" title="Adicionar foto">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingId === p.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleQuickUpload(p.id, file);
                        }}
                      />
                    </label>
                  )}
                  <button
                    onClick={() => onToggleActive(p.id, p.active)}
                    className="rounded-full p-2 hover:bg-muted transition-colors"
                    title={p.active ? "Desativar" : "Ativar"}
                  >
                    {p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-50" />}
                  </button>
                  <button onClick={() => onEdit(p)} className="rounded-full p-2 hover:bg-muted transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(p.id)} className="rounded-full p-2 hover:bg-muted transition-colors text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhum produto encontrado.
          </p>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-2">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            Carregar mais ({filtered.length - visibleCount} restantes)
          </button>
        </div>
      )}
    </div>
  );
}