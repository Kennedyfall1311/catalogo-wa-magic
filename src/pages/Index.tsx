import { useState, useMemo } from "react";
import { CatalogHeader } from "@/components/CatalogHeader";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductCard } from "@/components/ProductCard";
import { CatalogFooter } from "@/components/CatalogFooter";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { useProducts } from "@/hooks/useProducts";
import { CATEGORIES } from "@/types/product";

const Index = () => {
  const { products } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products
      .filter((p) => p.active)
      .filter((p) => !category || p.category === category)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search, category]);

  const categoryLabel = category
    ? CATEGORIES.find((c) => c.slug === category)?.name ?? "GERAL"
    : "GERAL";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CatalogHeader />

      <main className="flex-1">
        <div className="container py-4 space-y-4">
          {/* Category dropdown + search */}
          <CategoryFilter
            selected={category}
            onSelect={setCategory}
            searchQuery={search}
            onSearchChange={setSearch}
          />

          {/* Section title */}
          <h2 className="text-center text-lg font-bold uppercase tracking-wide">
            {categoryLabel}
          </h2>

          {filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-lg">Nenhum produto encontrado</p>
              <p className="text-sm mt-1">Tente outra busca ou categoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 border-t border-l">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CatalogFooter />
      <WhatsAppFloating />
    </div>
  );
};

export default Index;
