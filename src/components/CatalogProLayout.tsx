import { useState, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";
import type { CatalogTab } from "@/hooks/useCatalogTabs";

interface Props {
  products: DbProduct[];
  categories: DbCategory[];
  tabs: CatalogTab[];
  settings: Record<string, string>;
  whatsappNumber: string;
  hideNoPhoto: boolean;
}

const PAGE_SIZE = 40;

export function CatalogProLayout({ products, categories, tabs, settings, whatsappNumber, hideNoPhoto }: Props) {
  const [activeTabId, setActiveTabId] = useState<string | null>(tabs[0]?.id || null);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Base filtered products (active + photo filter)
  const baseProducts = useMemo(
    () =>
      products
        .filter((p) => p.active)
        .filter((p) => !hideNoPhoto || (p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== "")),
    [products, hideNoPhoto]
  );

  // Apply tab filter
  const tabFiltered = useMemo(() => {
    if (!activeTab) return baseProducts;
    switch (activeTab.filter_type) {
      case "promotion":
        return baseProducts.filter((p) => p.original_price && p.original_price > p.price);
      case "featured":
        return baseProducts
          .filter((p) => p.featured)
          .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));
      case "category":
        return baseProducts.filter((p) => p.category_id === activeTab.filter_value);
      case "all":
      default:
        return baseProducts;
    }
  }, [baseProducts, activeTab]);

  // Apply search
  const filtered = useMemo(() => {
    if (!search) return tabFiltered;
    const q = search.toLowerCase();
    return tabFiltered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.manufacturer_code && p.manufacturer_code.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [tabFiltered, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const gridClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5";

  return (
    <div className="space-y-3">
      {/* Unified search + tabs bar */}
      <div className="flex items-center gap-0 rounded-full border bg-card shadow-sm overflow-hidden">
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            placeholder="Buscar..."
            className="w-32 sm:w-44 bg-transparent pl-9 pr-3 py-2.5 text-xs outline-none border-r"
          />
        </div>
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`shrink-0 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTabId === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg">Nenhum produto encontrado</p>
          <p className="text-sm mt-1">Tente outra busca ou aba</p>
        </div>
      ) : (
        <>
          <div className={`grid ${gridClass} border-t border-l`}>
            {visible.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                whatsappNumber={whatsappNumber}
                buttonColor={settings.button_color}
                textColor={settings.text_color}
                priceColor={settings.price_color}
                catalogSettings={settings}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                Carregar mais produtos ({filtered.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
