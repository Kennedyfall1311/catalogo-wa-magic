import { useState, useEffect, useRef } from "react";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { CompanyInfoDrawer } from "@/components/CompanyInfoDrawer";

interface CatalogHeaderProps {
  storeName?: string;
  storeSubtitle?: string;
  logoUrl?: string;
  welcomeText?: string;
  welcomeSubtext?: string;
  headerColor?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  companyHours?: string;
  companyDescription?: string;
}

export function CatalogHeader({ storeName, storeSubtitle, logoUrl, welcomeText, welcomeSubtext, headerColor, companyPhone, companyEmail, companyAddress, companyHours, companyDescription }: CatalogHeaderProps) {
  const { totalItems } = useCart();
  const [showStickyBar, setShowStickyBar] = useState(false);
  const mainHeaderRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (mainHeaderRef.current) observer.observe(mainHeaderRef.current);
    return () => observer.disconnect();
  }, []);

  const colorStyle = headerColor ? { backgroundColor: headerColor, color: '#fff' } : undefined;

  return (
    <>
      {/* Sticky top bar - only visible when main header is out of view */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 border-b transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : '-translate-y-full'}`}
        style={colorStyle}
      >
        <div className={`flex items-center justify-between px-4 py-2 ${!headerColor ? 'bg-card' : ''}`}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 cursor-pointer">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName || "Logo"} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <ShoppingBag className="h-5 w-5" />
            )}
            <span className="text-xs sm:text-sm md:text-base font-bold tracking-tight uppercase truncate max-w-[140px] sm:max-w-none">
              {storeName || "Catálogo"}
            </span>
          </button>
          <CompanyInfoDrawer storeName={storeName} logoUrl={logoUrl} headerColor={headerColor} companyPhone={companyPhone} companyEmail={companyEmail} companyAddress={companyAddress} companyHours={companyHours} companyDescription={companyDescription} />
        </div>
      </div>

      <header ref={mainHeaderRef} className={`${!headerColor ? 'bg-card' : ''}`} style={colorStyle}>
        <div className="flex flex-col items-center py-3 md:py-4">
          <Link to="/" className="flex flex-col items-center gap-0.5">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName || "Logo"} className="h-20 w-20 md:h-24 md:w-24 rounded-full object-cover" />
            ) : (
              <ShoppingBag className="h-8 w-8 md:h-10 md:w-10" />
            )}
            <span className="text-xl md:text-2xl font-bold tracking-tight uppercase">
              {storeName || "Catálogo"}
            </span>
            <span className={`text-[9px] md:text-[10px] tracking-[0.3em] uppercase ${headerColor ? 'opacity-70' : 'text-muted-foreground'}`}>
              {storeSubtitle || "Distribuidora"}
            </span>
          </Link>
        </div>

        <div className={`border-t px-4 py-2 md:py-3 text-center space-y-1 ${headerColor ? 'border-white/20 bg-black/10' : 'bg-muted/50'}`}>
          <p className="text-xs md:text-sm font-semibold">
            {welcomeText || "❤️ Bem-vindo ao nosso catálogo digital! ❤️"}
          </p>
          <p className={`text-[10px] md:text-xs italic ${headerColor ? 'opacity-70' : 'text-muted-foreground'}`}>
            {welcomeSubtext || "Escolha seus produtos e faça seu pedido diretamente pelo WhatsApp."}
          </p>
          <p className="text-[10px] md:text-xs font-semibold uppercase">
            Clique em "Comprar" para adicionar à sacola
          </p>
        </div>
      </header>
    </>
  );
}