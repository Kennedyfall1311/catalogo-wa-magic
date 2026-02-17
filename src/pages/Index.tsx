import { useState, useMemo, useCallback, useEffect } from "react";
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
  const { products, categories, loading, error } = useDbProducts();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const { activeBanners } = useBanners();
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [priceSort, setPriceSort] = useState<"asc" | "desc" | null>(null);
  const [nameSort, setNameSort] = useState<"asc" | "desc" | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const quickFilters = useMemo(() => [
    {
      key: "promo",
      label: settings.quick_filter_promo_label || "Promoção",
      visible: settings.quick_filter_promo_visible === "true",
      bgColor: settings.quick_filter_promo_bg || "#1f1f1f",
      textColor: settings.quick_filter_promo_text || "#ffffff",
      style: (settings.quick_filter_promo_style || "solid") as "solid" | "outline",
    },
    {
      key: "custom1",
      label: settings.quick_filter_custom1_label || "Destaque",
      visible: settings.quick_filter_custom1_visible === "true",
      bgColor: settings.quick_filter_custom1_bg || "#1f1f1f",
      textColor: settings.quick_filter_custom1_text || "#ffffff",
      style: (settings.quick_filter_custom1_style || "solid") as "solid" | "outline",
    },
    {
      key: "custom2",
      label: settings.quick_filter_custom2_label || "Novidades",
      visible: settings.quick_filter_custom2_visible === "true",
      bgColor: settings.quick_filter_custom2_bg || "#1f1f1f",
      textColor: settings.quick_filter_custom2_text || "#ffffff",
      style: (settings.quick_filter_custom2_style || "solid") as "solid" | "outline",
    },
  ], [settings]);

  const categoryOptions = useMemo(() =>
    categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    [categories]
  );

  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.active && p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [products]);

  const hideNoPhoto = settings.hide_products_without_photo === "true";
  const hideOutOfStock = settings.hide_out_of_stock === "true";

  const displayMode = settings.catalog_first_page_mode || "default";

  // Seeded random shuffle for consistent rendering
  const [shuffleKey, setShuffleKey] = useState(0);

  // Auto-reshuffle timer
  useEffect(() => {
    if (displayMode !== "random") return;
    const interval = Number(settings.random_shuffle_interval || "30") * 1000;
    const timer = setInterval(() => setShuffleKey((k) => k + 1), interval);
    return () => clearInterval(timer);
  }, [displayMode, settings.random_shuffle_interval]);

  const shuffled = useMemo(() => {
    if (displayMode !== "random") return null;
    const arr = [...products.filter((p) => p.active).filter((p) => !hideNoPhoto || (p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== "")).filter((p) => !hideOutOfStock || (p.quantity != null && p.quantity > 0))];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, hideNoPhoto, hideOutOfStock, displayMode, shuffleKey]);

  const filtered = useMemo(() => {
    const base = products
      .filter((p) => p.active)
      .filter((p) => !hideNoPhoto || (p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== ""))
      .filter((p) => !hideOutOfStock || (p.quantity != null && p.quantity > 0))
      .filter((p) => !category || p.category_id === category)
      .filter((p) => !selectedBrand || p.brand === selectedBrand)
      .filter((p) => {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q)
          || (p.code && p.code.toLowerCase().includes(q))
          || (p.manufacturer_code && p.manufacturer_code.toLowerCase().includes(q))
          || (p.description && p.description.toLowerCase().includes(q))
          || (p.brand && p.brand.toLowerCase().includes(q));
      })
      .filter((p) => {
        if (!activeQuickFilter) return true;
        if (activeQuickFilter === "promo") return p.original_price && p.original_price > p.price;
        if (activeQuickFilter === "custom1") {
          const filterType = settings.quick_filter_custom1_type || "manual";
          if (filterType === "promotion") return p.original_price && p.original_price > p.price;
          if (filterType === "category") return p.category_id === settings.quick_filter_custom1_type_category;
          return (p as any).quick_filter_1 === true;
        }
        if (activeQuickFilter === "custom2") {
          const filterType = settings.quick_filter_custom2_type || "manual";
          if (filterType === "promotion") return p.original_price && p.original_price > p.price;
          if (filterType === "category") return p.category_id === settings.quick_filter_custom2_type_category;
          return (p as any).quick_filter_2 === true;
        }
        return true;
      });

    // Apply sorting
    if (nameSort === "asc") base.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    else if (nameSort === "desc") base.sort((a, b) => b.name.localeCompare(a.name, "pt-BR"));
    else if (priceSort === "asc") base.sort((a, b) => a.price - b.price);
    else if (priceSort === "desc") base.sort((a, b) => b.price - a.price);

    return base;
  }, [products, search, category, selectedBrand, hideNoPhoto, hideOutOfStock, activeQuickFilter, settings, priceSort, nameSort]);

  // Build the display list: first page uses display mode, subsequent pages use normal order
  const visibleProducts = useMemo(() => {
    const isFirstPageOnly = visibleCount <= PAGE_SIZE;
    const hasFilters = !!category || !!search || !!activeQuickFilter || !!selectedBrand;

    // When filters are active, always use normal filtered list
    if (hasFilters) return filtered.slice(0, visibleCount);

    if (displayMode === "featured" && isFirstPageOnly) {
      const featuredItems = products
        .filter((p) => p.active && p.featured)
        .filter((p) => !hideNoPhoto || (p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== ""))
        .filter((p) => !hideOutOfStock || (p.quantity != null && p.quantity > 0))
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

      {activeBanners.length > 0 && <BannerCarousel banners={activeBanners} intervalMs={Number(settings.banner_interval || "5") * 1000} />}

      <main className="flex-1">
        <div className="container py-4 space-y-4">
          <CategoryFilter
              categories={categoryOptions}
              selected={category}
              onSelect={handleCategoryChange}
              searchQuery={search}
              onSearchChange={handleSearchChange}
              quickFilters={quickFilters}
              activeQuickFilter={activeQuickFilter}
              onQuickFilterChange={(key) => { setActiveQuickFilter(key); setVisibleCount(PAGE_SIZE); }}
              priceSort={priceSort}
              onPriceSortChange={(sort) => { setPriceSort(sort); setNameSort(null); setVisibleCount(PAGE_SIZE); }}
              nameSort={nameSort}
              onNameSortChange={(sort) => { setNameSort(sort); setPriceSort(null); setVisibleCount(PAGE_SIZE); }}
              brands={brands}
              selectedBrand={selectedBrand}
              onBrandChange={(b) => { setSelectedBrand(b); setVisibleCount(PAGE_SIZE); }}
              showQuickFiltersOnMobile={settings.show_quick_filters_mobile === "true"}
              showBrandOnMobile={settings.show_brand_filter_mobile === "true"}
              showBrandFilter={settings.brand_filter_enabled !== "false"}
            />

            <h2 className="text-center text-lg font-bold uppercase tracking-wide">
              {categoryLabel}
            </h2>

            {loading ? (
              <div className="py-20 text-center text-muted-foreground">
                <p className="text-lg">Carregando produtos...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center text-destructive">
                <p className="text-lg">⚠️ Erro ao carregar</p>
                <p className="text-sm mt-1 text-muted-foreground">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
                  Tentar novamente
                </button>
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
