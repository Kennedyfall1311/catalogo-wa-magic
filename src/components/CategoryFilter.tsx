import { Search, ChevronDown, Tag } from "lucide-react";

interface QuickFilterButton {
  key: string;
  label: string;
  visible: boolean;
  bgColor: string;
  textColor: string;
  style: "solid" | "outline";
}

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
  quickFilters?: QuickFilterButton[];
  activeQuickFilter?: string | null;
  onQuickFilterChange?: (key: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect, searchQuery, onSearchChange, quickFilters, activeQuickFilter, onQuickFilterChange }: CategoryFilterProps) {
  const visibleFilters = quickFilters?.filter((f) => f.visible) || [];

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

      {visibleFilters.length > 0 && (
        <div className="flex gap-1 sm:gap-1.5 flex-wrap sm:flex-nowrap">
          {visibleFilters.map((filter) => {
            const isActive = activeQuickFilter === filter.key;
            const isSolid = filter.style === "solid";

            const bgStyle = isSolid
              ? filter.bgColor
              : isActive ? filter.bgColor : "transparent";
            const txtStyle = isSolid
              ? filter.textColor
              : isActive ? filter.textColor : filter.bgColor;
            const borderStyle = filter.bgColor;

            return (
              <button
                key={filter.key}
                onClick={() => onQuickFilterChange?.(isActive ? null : filter.key)}
                className={`rounded-md sm:rounded-lg border sm:border-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                  !isSolid && isActive ? "opacity-100" : !isSolid ? "opacity-90" : ""
                }`}
                style={{
                  backgroundColor: bgStyle,
                  color: txtStyle,
                  borderColor: borderStyle,
                }}
              >
                <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {filter.label}
              </button>
            );
          })}
        </div>
      )}

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
