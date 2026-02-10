import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";

interface ProductListProps {
  products: DbProduct[];
  categories: DbCategory[];
  onEdit: (product: DbProduct) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

export function ProductList({ products, categories, onEdit, onDelete, onToggleActive }: ProductListProps) {
  return (
    <div className="space-y-2">
      {products.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <img
            src={p.image_url || "/placeholder.svg"}
            alt={p.name}
            className="h-12 w-12 rounded-md object-cover bg-muted shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-sm truncate ${!p.active ? "opacity-50" : ""}`}>
              {p.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {p.code && <span>{p.code} · </span>}
              R$ {Number(p.price).toFixed(2).replace(".", ",")}
              {" · "}
              {categories.find((c) => c.id === p.category_id)?.name || "Sem categoria"}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleActive(p.id, p.active)}
              className="rounded-full p-2 hover:bg-muted transition-colors"
              title={p.active ? "Desativar" : "Ativar"}
            >
              {p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-50" />}
            </button>
            <button
              onClick={() => onEdit(p)}
              className="rounded-full p-2 hover:bg-muted transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(p.id)}
              className="rounded-full p-2 hover:bg-muted transition-colors text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {products.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Nenhum produto cadastrado. Adicione ou importe produtos.
        </p>
      )}
    </div>
  );
}
