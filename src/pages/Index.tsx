import { useState, useMemo } from "react";
import { CatalogHeader } from "@/components/CatalogHeader";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductCard } from "@/components/ProductCard";
import { CatalogFooter } from "@/components/CatalogFooter";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { CartFloating } from "@/components/CartFloating";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const Index = () => {
  const { products, categories, loading } = useDbProducts();
  const { settings } = useStoreSettings();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categoryOptions = useMemo(() =>
    categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    [categories]
  );

  const filtered = useMemo(() => {
    return products
      .filter((p) => p.active)
      .filter((p) => !category || p.category_id === category)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search, category]);

  const categoryLabel = category
    ? categories.find((c) => c.id === category)?.name ?? "GERAL"
    : "GERAL";

  const whatsappNumber = settings.whatsapp_number || "5511999999999";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CatalogHeader
        storeName={settings.store_name}
        storeSubtitle={settings.store_subtitle}
        logoUrl={settings.logo_url}
        welcomeText={settings.welcome_text}
        welcomeSubtext={settings.welcome_subtext}
        headerColor={settings.header_color}
      />

      <main className="flex-1">
        <div className="container py-4 space-y-4">
          <CategoryFilter
            categories={categoryOptions}
            selected={category}
            onSelect={setCategory}
            searchQuery={search}
            onSearchChange={setSearch}
          />

          <h2 className="text-center text-lg font-bold uppercase tracking-wide">
            {categoryLabel}
          </h2>

          {loading ? (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-lg">Carregando produtos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-lg">Nenhum produto encontrado</p>
              <p className="text-sm mt-1">Tente outra busca ou categoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 border-t border-l">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} whatsappNumber={whatsappNumber} buttonColor={settings.button_color} textColor={settings.text_color} priceColor={settings.price_color} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CatalogFooter storeName={settings.store_name} footerColor={settings.footer_color} />
      <WhatsAppFloating whatsappNumber={whatsappNumber} />
      <CartFloating />
    </div>
  );
};

export default Index;
