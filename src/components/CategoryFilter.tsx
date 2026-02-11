import { Search, ChevronDown } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  categories: CategoryOption[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function CategoryFilter({ categories, selected, onSelect, searchQuery, onSearchChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome, código, fabricante..."
          className="w-full rounded-lg border bg-card pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="relative">
        <select
          value={selected ?? ""}
          onChange={(e) => onSelect(e.target.value || null)}
          className="w-full sm:w-48 appearance-none rounded-lg border bg-card px-4 py-2.5 pr-8 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
