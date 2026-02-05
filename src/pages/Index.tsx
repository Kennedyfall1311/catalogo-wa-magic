import { useState, useMemo } from "react";
import { CatalogHeader } from "@/components/CatalogHeader";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductCard } from "@/components/ProductCard";
import { CatalogFooter } from "@/components/CatalogFooter";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { useProducts } from "@/hooks/useProducts";

const Index = () => {
  const { products } = useProducts();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products
      .filter((p) => p.active)
      .filter((p) => !category || p.category === category)
      .filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
  }, [products, search, category]);

  return (
    <div className="min-h-screen flex flex-col">
      <CatalogHeader searchQuery={search} onSearchChange={setSearch} />

      <main className="flex-1">
        <div className="container py-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Nossos Produtos</h1>
            <p className="mt-1 text-muted-foreground">Encontre o que procura e peça pelo WhatsApp</p>
          </div>

          <CategoryFilter selected={category} onSelect={setCategory} />

          {filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-lg">Nenhum produto encontrado</p>
              <p className="text-sm mt-1">Tente outra busca ou categoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
