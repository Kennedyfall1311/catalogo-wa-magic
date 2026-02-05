import { CATEGORIES } from "@/types/product";

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
          selected === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-accent"
        }`}
      >
        Todos
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(cat.slug === selected ? null : cat.slug)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selected === cat.slug
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
