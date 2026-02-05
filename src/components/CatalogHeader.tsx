import { Search, Menu, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface CatalogHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CatalogHeader({ searchQuery, onSearchChange }: CatalogHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <ShoppingBag className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">Catálogo</span>
        </Link>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-full border bg-muted/50 py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden rounded-full p-2 hover:bg-muted transition-colors"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              const url = window.location.origin;
              navigator.clipboard.writeText(url);
            }}
            className="rounded-full p-2 hover:bg-muted transition-colors text-sm font-medium hidden sm:block"
            title="Compartilhar catálogo"
          >
            Compartilhar
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <div className="md:hidden border-t px-4 py-3 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              className="w-full rounded-full border bg-muted/50 py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}
    </header>
  );
}
