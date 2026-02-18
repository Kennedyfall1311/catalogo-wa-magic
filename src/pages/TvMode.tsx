import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useBanners } from "@/hooks/useBanners";
import { Monitor, ShoppingBag } from "lucide-react";

function getCustomSizes(scale: number) {
  const imgVh = Math.round(35 + scale * 0.4);
  const titleRem = 1.2 + scale * 0.04;
  const titleLgRem = titleRem * 1.5;
  const priceRem = 1.6 + scale * 0.05;
  const priceLgRem = priceRem * 1.5;
  const gap = Math.round(4 + scale * 0.16);
  const gapLg = Math.round(gap * 1.8);
  return { imgVh, titleRem, titleLgRem, priceRem, priceLgRem, gap: gap * 4, gapLg: gapLg * 4 };
}

export default function TvMode() {
  const { products, loading } = useDbProducts();
  const { settings } = useStoreSettings();
  const { activeBanners } = useBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  const mountedRef = useRef(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const intervalSec = Number(settings.tv_mode_interval || "5");
  const bannerIntervalSec = Number(settings.tv_banner_interval || "5");
  const bgColor = settings.tv_bg_color || "#000000";
  const bgImage = settings.tv_bg_image || "";
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
  const productScale = Number(settings.tv_product_size || "50");
  const sizes = getCustomSizes(productScale);

  const tvProducts = useMemo(() => {
    const withImage = products.filter(
      (p) => p.active && p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== ""
    );

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

  const displayBanners = showBanners && activeBanners.length > 0;
  const productCount = tvProducts.length;

  // Product rotation with safe fade
  const advance = useCallback(() => {
    if (productCount <= 1) return;
    setFade(false);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setCurrentIndex((i) => (i + 1) % productCount);
      setFade(true);
    }, 400);
  }, [productCount]);

  useEffect(() => {
    if (productCount <= 1) return;
    const timer = setTimeout(advance, intervalSec * 1000);
    return () => clearTimeout(timer);
  }, [advance, intervalSec, currentIndex, productCount]);

  // Reset index safely when product list changes
  useEffect(() => {
    setCurrentIndex((prev) => (prev >= productCount ? 0 : prev));
  }, [productCount]);

  // Banner rotation (independent)
  useEffect(() => {
    if (!displayBanners || activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      if (!mountedRef.current) return;
      setBannerIndex((i) => (i + 1) % activeBanners.length);
    }, bannerIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [displayBanners, activeBanners.length, bannerIntervalSec]);

  // Reset banner index when banners change
  useEffect(() => {
    setBannerIndex((prev) => (activeBanners.length > 0 ? prev % activeBanners.length : 0));
  }, [activeBanners.length]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: bgColor, color: textColor }}>
        <p className="text-xl animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (productCount === 0) {
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

  const safeIndex = currentIndex < productCount ? currentIndex : 0;
  const product = tvProducts[safeIndex];
  const hasDiscount = showDiscount && product.original_price && product.original_price > product.price;
  const currentBanner = displayBanners ? activeBanners[bannerIndex % activeBanners.length] : null;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative select-none cursor-none" style={{ backgroundColor: bgColor, color: textColor, ...(bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}) }}>
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

      {/* Banner below navbar */}
      {currentBanner && (
        <div className="w-full shrink-0 overflow-hidden">
          <img
            src={currentBanner.image_url}
            alt="Banner"
            className="w-full object-cover max-h-[120px] lg:max-h-[180px]"
          />
        </div>
      )}

      {/* Main product display */}
      <div
        className="flex-1 flex items-center justify-center p-8 transition-opacity duration-400"
        style={{ opacity: fade ? 1 : 0 }}
      >
        <div className="flex flex-col lg:flex-row items-center max-w-7xl w-full" style={{ gap: `${sizes.gap}px` }}>
          {/* Image */}
          <div className="flex-1 flex items-center justify-center" style={{ maxHeight: `${sizes.imgVh}vh` }}>
            <img
              src={product.image_url || ""}
              alt={product.name}
              className="max-w-full object-contain rounded-lg shadow-2xl"
              style={{ maxHeight: `${sizes.imgVh}vh` }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
            <h1 className="font-bold uppercase leading-tight" style={{ fontSize: `${sizes.titleRem}rem` }}>
              {product.name}
            </h1>

            {showCode && product.code && (
              <p className="text-lg" style={{ opacity: 0.5 }}>Cód: {product.code}</p>
            )}

            <div className="space-y-1">
              {hasDiscount && (
                <p className="text-xl line-through" style={{ opacity: 0.4 }}>
                  R$ {Number(product.original_price).toFixed(2).replace(".", ",")}
                </p>
              )}
              <p className="font-extrabold" style={{ color: priceColor, fontSize: `${sizes.priceRem}rem` }}>
                R$ {Number(product.price).toFixed(2).replace(".", ",")}
              </p>
            </div>

            {showBrand && product.brand && (
              <p className="text-lg" style={{ opacity: 0.6 }}>{product.brand}</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="h-1.5 w-full" style={{ backgroundColor: `${textColor}15` }}>
          <div
            className="h-full transition-all ease-linear"
            style={{
              width: `${((safeIndex + 1) / productCount) * 100}%`,
              backgroundColor: `${textColor}99`,
            }}
          />
        </div>
      )}

      {/* Counter */}
      {showCounter && (
        <div className="absolute bottom-4 right-6 text-sm font-mono" style={{ color: textColor, opacity: 0.3 }}>
          {safeIndex + 1} / {productCount}
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
