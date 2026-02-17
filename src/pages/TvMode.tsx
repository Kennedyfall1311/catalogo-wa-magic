import { useState, useEffect, useMemo, useCallback } from "react";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Monitor, ShoppingBag } from "lucide-react";

const SIZE_MAP = {
  small: { imgMax: "max-h-[45vh]", title: "text-2xl lg:text-3xl", price: "text-3xl lg:text-4xl", gap: "gap-6 lg:gap-10" },
  medium: { imgMax: "max-h-[65vh]", title: "text-3xl lg:text-5xl", price: "text-4xl lg:text-6xl", gap: "gap-8 lg:gap-16" },
  large: { imgMax: "max-h-[78vh]", title: "text-4xl lg:text-6xl", price: "text-5xl lg:text-7xl", gap: "gap-10 lg:gap-20" },
};

export default function TvMode() {
  const { products, loading } = useDbProducts();
  const { settings } = useStoreSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const intervalSec = Number(settings.tv_mode_interval || "5");
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
  const productSource = settings.tv_product_source || "featured";
  const productSize = (settings.tv_product_size || "medium") as keyof typeof SIZE_MAP;
  const fontFamily = settings.tv_font_family && settings.tv_font_family !== "system" ? settings.tv_font_family : undefined;

  const sizes = SIZE_MAP[productSize] || SIZE_MAP.medium;

  const tvProducts = useMemo(() => {
    const withImage = products
      .filter((p) => p.active)
      .filter((p) => p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== "");

    if (productSource === "latest") {
      return [...withImage].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return withImage
      .filter((p) => p.featured)
      .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));
  }, [products, productSource]);

  const advance = useCallback(() => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % tvProducts.length);
      setFade(true);
    }, 400);
  }, [tvProducts.length]);

  useEffect(() => {
    if (tvProducts.length <= 1) return;
    const timer = setInterval(advance, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [advance, intervalSec, tvProducts.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [tvProducts.length]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: bgColor, color: textColor, fontFamily }}>
        <p className="text-xl animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (tvProducts.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: bgColor, color: textColor, fontFamily }}>
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

  const product = tvProducts[currentIndex];
  const hasDiscount = showDiscount && product.original_price && product.original_price > product.price;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative select-none cursor-none" style={{ backgroundColor: bgColor, color: textColor, fontFamily }}>
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

      {/* Main product display */}
      <div
        className="flex-1 flex items-center justify-center p-8 transition-opacity duration-400"
        style={{ opacity: fade ? 1 : 0 }}
      >
        <div className={`flex flex-col lg:flex-row items-center ${sizes.gap} max-w-7xl w-full`}>
          {/* Image */}
          <div className={`flex-1 flex items-center justify-center ${sizes.imgMax}`}>
            <img
              src={product.image_url || ""}
              alt={product.name}
              className={`${sizes.imgMax} max-w-full object-contain rounded-lg shadow-2xl`}
            />
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
            <h1 className={`${sizes.title} font-bold uppercase leading-tight`}>
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
              <p className={`${sizes.price} font-extrabold`} style={{ color: priceColor }}>
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
              width: `${((currentIndex + 1) / tvProducts.length) * 100}%`,
              backgroundColor: `${textColor}99`,
            }}
          />
        </div>
      )}

      {/* Counter */}
      {showCounter && (
        <div className="absolute bottom-4 right-6 text-sm font-mono" style={{ color: textColor, opacity: 0.3 }}>
          {currentIndex + 1} / {tvProducts.length}
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
