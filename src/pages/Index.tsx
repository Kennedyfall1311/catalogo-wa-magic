import { useState, useMemo, useCallback } from "react";
import { CatalogHeader } from "@/components/CatalogHeader";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductCard } from "@/components/ProductCard";
import { CatalogFooter } from "@/components/CatalogFooter";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { CartFloating } from "@/components/CartFloating";
import { BannerCarousel } from "@/components/BannerCarousel";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useBanners } from "@/hooks/useBanners";

const Index = () => {
  const { products, categories, loading } = useDbProducts();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const { activeBanners } = useBanners();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categoryOptions = useMemo(() =>
    categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    [categories]
  );

  const hideNoPhoto = settings.hide_products_without_photo === "true";

  const displayMode = settings.catalog_first_page_mode || "default";

  // Seeded random shuffle for consistent rendering
  const shuffled = useMemo(() => {
    if (displayMode !== "random") return null;
    const arr = [...products.filter((p) => p.active).filter((p) => !hideNoPhoto || (p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== ""))];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // Only reshuffle on product data changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, hideNoPhoto, displayMode]);

  const filtered = useMemo(() => {
    const base = products
      .filter((p) => p.active)
      .filter((p) => !hideNoPhoto || (p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== ""))
      .filter((p) => !category || p.category_id === category)
      .filter((p) => {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q)
          || (p.code && p.code.toLowerCase().includes(q))
          || (p.manufacturer_code && p.manufacturer_code.toLowerCase().includes(q))
          || (p.description && p.description.toLowerCase().includes(q));
      });
    return base;
  }, [products, search, category, hideNoPhoto]);

  // Build the display list: first page uses display mode, subsequent pages use normal order
  const visibleProducts = useMemo(() => {
    const isFirstPageOnly = visibleCount <= PAGE_SIZE;
    const hasFilters = !!category || !!search;

    // When filters are active, always use normal filtered list
    if (hasFilters) return filtered.slice(0, visibleCount);

    if (displayMode === "featured" && isFirstPageOnly) {
      const featuredItems = products
        .filter((p) => p.active && p.featured)
        .filter((p) => !hideNoPhoto || (p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== ""))
        .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));
      
      // Fill remaining slots with non-featured products
      const featuredIds = new Set(featuredItems.map((p) => p.id));
      const rest = filtered.filter((p) => !featuredIds.has(p.id));
      const combined = [...featuredItems, ...rest];
      return combined.slice(0, visibleCount);
    }

    if (displayMode === "random" && isFirstPageOnly && shuffled) {
      // Apply category/search filters to shuffled list
      return shuffled.slice(0, visibleCount);
    }

    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount, displayMode, products, hideNoPhoto, shuffled, category, search, PAGE_SIZE]);

  // Reset visible count when filters change
  const handleCategoryChange = useCallback((cat: string | null) => {
    setCategory(cat);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleSearchChange = useCallback((q: string) => {
    setSearch(q);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const hasMore = visibleCount < filtered.length;

  const categoryLabel = category
    ? categories.find((c) => c.id === category)?.name ?? "GERAL"
    : "GERAL";

  const whatsappNumber = settings.whatsapp_number || "5511999999999";

  const gridClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5";

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CatalogHeader
        storeName={settings.store_name}
        storeSubtitle={settings.store_subtitle}
        logoUrl={settings.logo_url}
        welcomeText={settings.welcome_text}
        welcomeSubtext={settings.welcome_subtext}
        headerColor={settings.header_color}
        companyPhone={settings.company_phone}
        companyEmail={settings.company_email}
        companyAddress={settings.company_address}
        companyHours={settings.company_hours}
        companyDescription={settings.company_description}
      />

      {activeBanners.length > 0 && <BannerCarousel banners={activeBanners} />}

      <main className="flex-1">
        <div className="container py-4 space-y-4">
          <CategoryFilter
            categories={categoryOptions}
            selected={category}
            onSelect={handleCategoryChange}
            searchQuery={search}
            onSearchChange={handleSearchChange}
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
            <>
              <div className={`grid ${gridClass} border-t border-l`}>
                {visibleProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} whatsappNumber={whatsappNumber} buttonColor={settings.button_color} textColor={settings.text_color} priceColor={settings.price_color} catalogSettings={settings} />
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
      </main>

      <CatalogFooter
        storeName={settings.store_name}
        footerColor={settings.footer_color}
        socialInstagram={settings.social_instagram}
        socialFacebook={settings.social_facebook}
        socialTiktok={settings.social_tiktok}
        socialYoutube={settings.social_youtube}
        socialWebsite={settings.social_website}
      />
      <WhatsAppFloating whatsappNumber={whatsappNumber} />
      <CartFloating />
    </div>
  );
};

export default Index;
