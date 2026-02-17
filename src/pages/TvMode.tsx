import { useState, useEffect, useMemo, useCallback } from "react";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useBanners } from "@/hooks/useBanners";
import { Monitor, ShoppingBag } from "lucide-react";

const SIZE_MAP = {
  small: { imgMax: "max-h-[45vh]", title: "text-2xl lg:text-3xl", price: "text-3xl lg:text-4xl", gap: "gap-6 lg:gap-10" },
  medium: { imgMax: "max-h-[65vh]", title: "text-3xl lg:text-5xl", price: "text-4xl lg:text-6xl", gap: "gap-8 lg:gap-16" },
  large: { imgMax: "max-h-[78vh]", title: "text-4xl lg:text-6xl", price: "text-5xl lg:text-7xl", gap: "gap-10 lg:gap-20" },
};

type SlideItem =
  | { type: "product"; product: ReturnType<typeof useDbProducts>["products"][number] }
  | { type: "banner"; imageUrl: string; link: string | null };

export default function TvMode() {
  const { products, loading } = useDbProducts();
  const { settings } = useStoreSettings();
  const { activeBanners } = useBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const intervalSec = Number(settings.tv_mode_interval || "5");
  const bannerIntervalSec = Number(settings.tv_banner_interval || "5");
  const bgColor = settings.tv_bg_color || "#000000";
  const textColor = settings.tv_text_color || "#ffffff";
  const priceColor = settings.tv_price_color || "#22c55e";
  const navBarColor = settings.tv_navbar_color || "#111111";
  const navBarTextColor = settings.tv_navbar_text_color || "#ffffff";
  const showLogo = settings.tv_show_logo !== "false";
  const showCode = settings.tv_show_code !== "false";
  const showBrand = settings.tv_show_brand !== "false";
  const showProgress = settings.tv_show_progress !== "false";
  const showCounter = settings.tv_show_counter !== "false";
  const showDiscount = settings.tv_show_discount !== "false";
  const showNavBar = settings.tv_show_navbar !== "false";
  const showBanners = settings.tv_show_banners !== "false";
  const productSource = settings.tv_product_source || "latest";
  const productSize = (settings.tv_product_size || "medium") as keyof typeof SIZE_MAP;

  const sizes = SIZE_MAP[productSize] || SIZE_MAP.medium;

  const tvProducts = useMemo(() => {
    const withImage = products
      .filter((p) => p.active)
      .filter((p) => p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== "");

    if (productSource === "manual") {
      let manualIds: string[] = [];
      try { manualIds = JSON.parse(settings.tv_product_ids || "[]"); } catch { /* */ }
      return manualIds
        .map((id) => withImage.find((p) => p.id === id))
        .filter(Boolean) as typeof products;
    }

    if (productSource === "latest") {
      return [...withImage].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return withImage
      .filter((p) => p.featured)
      .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));
  }, [products, productSource, settings.tv_product_ids]);

  // Build slide list: products + banners interleaved
  const slides: SlideItem[] = useMemo(() => {
    const productSlides: SlideItem[] = tvProducts.map((p) => ({ type: "product", product: p }));
    if (!showBanners || activeBanners.length === 0) return productSlides;

    // Insert a banner every N products (spread evenly)
    const result: SlideItem[] = [];
    const bannerEvery = Math.max(2, Math.ceil(tvProducts.length / activeBanners.length));
    let bannerIdx = 0;

    for (let i = 0; i < productSlides.length; i++) {
      result.push(productSlides[i]);
      if ((i + 1) % bannerEvery === 0 && bannerIdx < activeBanners.length) {
        result.push({
          type: "banner",
          imageUrl: activeBanners[bannerIdx].image_url,
          link: activeBanners[bannerIdx].link,
        });
        bannerIdx++;
      }
    }
    // Append remaining banners at the end
    while (bannerIdx < activeBanners.length) {
      result.push({
        type: "banner",
        imageUrl: activeBanners[bannerIdx].image_url,
        link: activeBanners[bannerIdx].link,
      });
      bannerIdx++;
    }

    return result;
  }, [tvProducts, showBanners, activeBanners]);

  const currentSlide = slides[currentIndex];
  const currentIntervalMs = currentSlide?.type === "banner"
    ? bannerIntervalSec * 1000
    : intervalSec * 1000;

  const advance = useCallback(() => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % slides.length);
      setFade(true);
    }, 400);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setTimeout(advance, currentIntervalMs);
    return () => clearTimeout(timer);
  }, [advance, currentIntervalMs, currentIndex, slides.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [slides.length]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: bgColor, color: textColor }}>
        <p className="text-xl animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: bgColor, color: textColor }}>
        <Monitor className="h-16 w-16" style={{ color: textColor, opacity: 0.4 }} />
        <p className="text-xl">Nenhum produto para exibir</p>
        <p className="text-sm" style={{ opacity: 0.6 }}>
          {productSource === "featured"
            ? "Marque produtos como destaque no painel admin para usar o Modo TV."
            : "Cadastre produtos ativos com imagem para usar o Modo TV."}
        </p>
      </div>
    );
  }

  const slide = slides[currentIndex] ?? slides[0];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative select-none cursor-none" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Nav bar */}
      {showNavBar && (
        <div className="flex items-center gap-3 px-6 py-3 shrink-0" style={{ backgroundColor: navBarColor }}>
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <ShoppingBag className="h-6 w-6" style={{ color: navBarTextColor, opacity: 0.7 }} />
          )}
          <span className="text-sm font-bold tracking-tight uppercase" style={{ color: navBarTextColor }}>
            {settings.store_name || "Catálogo"}
          </span>
          {settings.store_subtitle && (
            <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: navBarTextColor, opacity: 0.5 }}>
              {settings.store_subtitle}
            </span>
          )}
        </div>
      )}

      {/* Main content */}
      <div
        className="flex-1 flex items-center justify-center p-8 transition-opacity duration-400"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {slide.type === "banner" ? (
          <div className="flex items-center justify-center w-full h-full">
            <img
              src={slide.imageUrl}
              alt="Banner"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className={`flex flex-col lg:flex-row items-center ${sizes.gap} max-w-7xl w-full`}>
            {/* Image */}
            <div className={`flex-1 flex items-center justify-center ${sizes.imgMax}`}>
              <img
                src={slide.product.image_url || ""}
                alt={slide.product.name}
                className={`${sizes.imgMax} max-w-full object-contain rounded-lg shadow-2xl`}
              />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
              <h1 className={`${sizes.title} font-bold uppercase leading-tight`}>
                {slide.product.name}
              </h1>

              {showCode && slide.product.code && (
                <p className="text-lg" style={{ opacity: 0.5 }}>Cód: {slide.product.code}</p>
              )}

              <div className="space-y-1">
                {showDiscount && slide.product.original_price && slide.product.original_price > slide.product.price && (
                  <p className="text-xl line-through" style={{ opacity: 0.4 }}>
                    R$ {Number(slide.product.original_price).toFixed(2).replace(".", ",")}
                  </p>
                )}
                <p className={`${sizes.price} font-extrabold`} style={{ color: priceColor }}>
                  R$ {Number(slide.product.price).toFixed(2).replace(".", ",")}
                </p>
              </div>

              {showBrand && slide.product.brand && (
                <p className="text-lg" style={{ opacity: 0.6 }}>{slide.product.brand}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="h-1.5 w-full" style={{ backgroundColor: `${textColor}15` }}>
          <div
            className="h-full transition-all ease-linear"
            style={{
              width: `${((currentIndex + 1) / slides.length) * 100}%`,
              backgroundColor: `${textColor}99`,
            }}
          />
        </div>
      )}

      {/* Counter */}
      {showCounter && (
        <div className="absolute bottom-4 right-6 text-sm font-mono" style={{ color: textColor, opacity: 0.3 }}>
          {currentIndex + 1} / {slides.length}
        </div>
      )}

      {/* Standalone logo fallback (when navbar is off) */}
      {!showNavBar && showLogo && settings.logo_url && (
        <div className="absolute top-6 left-6">
          <img src={settings.logo_url} alt="Logo" className="h-12 w-12 rounded-full object-cover" style={{ opacity: 0.6 }} />
        </div>
      )}
    </div>
  );
}
