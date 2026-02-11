import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { CatalogTab } from "@/hooks/useCatalogTabs";
import type { DbCategory } from "@/hooks/useDbProducts";

interface Props {
  tabs: CatalogTab[];
  categories: DbCategory[];
  onAdd: (tab: { name: string; filter_type: string; filter_value?: string | null }) => Promise<any>;
  onUpdate: (id: string, data: Partial<CatalogTab>) => Promise<any>;
  onRemove: (id: string) => Promise<any>;
  onReorder: (tabs: CatalogTab[]) => Promise<void>;
}

const FILTER_TYPES = [
  { value: "all", label: "Todos os produtos" },
  { value: "promotion", label: "Promoções (com desconto)" },
  { value: "featured", label: "Produtos em destaque" },
  { value: "category", label: "Categoria específica" },
];

export function CatalogTabsManager({ tabs, categories, onAdd, onUpdate, onRemove, onReorder }: Props) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("all");
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    await onAdd({
      name: newName.trim(),
      filter_type: newType,
      filter_value: newType === "category" ? newCategory : null,
    });
    setNewName("");
    setNewType("all");
    setNewCategory("");
    setAdding(false);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const arr = [...tabs];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    onReorder(arr);
  };

  const moveDown = (index: number) => {
    if (index >= tabs.length - 1) return;
    const arr = [...tabs];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    onReorder(arr);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Crie e organize as abas que aparecerão no catálogo Pro. Cada aba filtra os produtos de forma diferente.
      </p>

      {/* Existing tabs */}
      <div className="space-y-2">
        {tabs.map((tab, i) => (
          <div key={tab.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tab.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {FILTER_TYPES.find((f) => f.value === tab.filter_type)?.label || tab.filter_type}
                {tab.filter_type === "category" && tab.filter_value && (
                  <> — {categories.find((c) => c.id === tab.filter_value)?.name || "?"}</>
                )}
              </p>
            </div>
            <Switch
              checked={tab.active}
              onCheckedChange={(val) => onUpdate(tab.id, { active: val })}
            />
            <div className="flex flex-col">
              <button onClick={() => moveUp(i)} disabled={i === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => moveDown(i)} disabled={i >= tabs.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <button onClick={() => onRemove(tab.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new tab */}
      <div className="rounded-lg border border-dashed p-3 space-y-3">
        <p className="text-xs font-semibold">Nova aba</p>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da aba (ex: Lançamentos)"
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {FILTER_TYPES.map((ft) => (
            <option key={ft.value} value={ft.value}>{ft.label}</option>
          ))}
        </select>
        {newType === "category" && (
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim() || (newType === "category" && !newCategory)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {adding ? "Adicionando..." : "Adicionar Aba"}
        </button>
      </div>
    </div>
  );
}
