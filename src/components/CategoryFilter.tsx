import { Search } from "lucide-react";
import { CATEGORIES } from "@/types/product";

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (slug: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CategoryFilter({ selected, onSelect, searchQuery, onSearchChange }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={selected ?? ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className="flex-1 border rounded-sm bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring cursor-pointer"
      >
        <option value="">Categorias</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.slug} value={cat.slug}>{cat.name}</option>
        ))}
      </select>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-10 focus:w-48 sm:w-48 border rounded-sm bg-card py-2.5 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
        />
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}
