import { useState, useEffect, useMemo, useCallback } from "react";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Monitor } from "lucide-react";

export default function TvMode() {
  const { products, loading } = useDbProducts();
  const { settings } = useStoreSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const intervalSec = Number(settings.tv_mode_interval || "5");
  const bgColor = settings.tv_bg_color || "#000000";
  const textColor = settings.tv_text_color || "#ffffff";
  const priceColor = settings.tv_price_color || "#22c55e";
  const showLogo = settings.tv_show_logo !== "false";
  const showCode = settings.tv_show_code !== "false";
  const showBrand = settings.tv_show_brand !== "false";
  const showProgress = settings.tv_show_progress !== "false";
  const showCounter = settings.tv_show_counter !== "false";
  const showDiscount = settings.tv_show_discount !== "false";

  const featuredProducts = useMemo(() => {
    return products
      .filter((p) => p.active && p.featured)
      .filter((p) => p.image_url && p.image_url !== "/placeholder.svg" && p.image_url.trim() !== "")
      .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));
  }, [products]);

  const advance = useCallback(() => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % featuredProducts.length);
      setFade(true);
    }, 400);
  }, [featuredProducts.length]);

  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const timer = setInterval(advance, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [advance, intervalSec, featuredProducts.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [featuredProducts.length]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: bgColor, color: textColor }}>
        <p className="text-xl animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: bgColor, color: textColor }}>
        <Monitor className="h-16 w-16" style={{ color: textColor, opacity: 0.4 }} />
        <p className="text-xl">Nenhum produto em destaque</p>
        <p className="text-sm" style={{ opacity: 0.6 }}>Marque produtos como destaque no painel admin para usar o Modo TV.</p>
      </div>
    );
  }

  const product = featuredProducts[currentIndex];
  const hasDiscount = showDiscount && product.original_price && product.original_price > product.price;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative select-none cursor-none" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Main product display */}
      <div
        className="flex-1 flex items-center justify-center p-8 transition-opacity duration-400"
        style={{ opacity: fade ? 1 : 0 }}
      >
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 max-w-6xl w-full">
          {/* Image */}
          <div className="flex-1 flex items-center justify-center max-h-[70vh]">
            <img
              src={product.image_url || ""}
              alt={product.name}
              className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
            <h1 className="text-3xl lg:text-5xl font-bold uppercase leading-tight">
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
              <p className="text-4xl lg:text-6xl font-extrabold" style={{ color: priceColor }}>
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
              width: `${((currentIndex + 1) / featuredProducts.length) * 100}%`,
              backgroundColor: `${textColor}99`,
            }}
          />
        </div>
      )}

      {/* Counter */}
      {showCounter && (
        <div className="absolute bottom-4 right-6 text-sm font-mono" style={{ color: textColor, opacity: 0.3 }}>
          {currentIndex + 1} / {featuredProducts.length}
        </div>
      )}

      {/* Store branding */}
      {showLogo && settings.logo_url && (
        <div className="absolute top-6 left-6">
          <img src={settings.logo_url} alt="Logo" className="h-12 w-12 rounded-full object-cover" style={{ opacity: 0.6 }} />
        </div>
      )}
    </div>
  );
}
