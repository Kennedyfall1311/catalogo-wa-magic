import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { categoriesApi } from "@/lib/api-client";
import type { DbCategory } from "@/hooks/useDbProducts";

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface CategoryManagerProps {
  categories: DbCategory[];
  onRefresh: () => void;
}

export function CategoryManager({ categories, onRefresh }: CategoryManagerProps) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    await categoriesApi.insert({ name, slug: slugify(name) });
    setNewName("");
    setAdding(false);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await categoriesApi.remove(id);
    onRefresh();
  };

  const handleEditSave = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    await categoriesApi.update(id, { name, slug: slugify(name) });
    setEditingId(null);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Categorias</h2>

      <div className="flex gap-2">
        <input
          placeholder="Nome da categoria"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
            {editingId === c.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEditSave(c.id)}
                  className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <button onClick={() => handleEditSave(c.id)} className="rounded-full p-2 hover:bg-muted transition-colors text-primary">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="rounded-full p-2 hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{c.name}</span>
                <button
                  onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                  className="rounded-full p-2 hover:bg-muted transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="rounded-full p-2 hover:bg-muted transition-colors text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhuma categoria cadastrada.
          </p>
        )}
      </div>
    </div>
  );
}
