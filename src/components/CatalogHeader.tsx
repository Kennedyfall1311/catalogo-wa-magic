import { Menu, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

interface CatalogHeaderProps {
  storeName?: string;
  storeSubtitle?: string;
  logoUrl?: string;
  welcomeText?: string;
  welcomeSubtext?: string;
  headerColor?: string;
}

export function CatalogHeader({ storeName, storeSubtitle, logoUrl, welcomeText, welcomeSubtext, headerColor }: CatalogHeaderProps) {
  const { totalItems } = useCart();

  const colorStyle = headerColor ? { backgroundColor: headerColor, color: '#fff' } : undefined;

  return (
    <>
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-40 border-b"
        style={colorStyle}
      >
        <div className={`flex items-center justify-between px-4 py-2 ${!headerColor ? 'bg-card' : ''}`}>
          <button className="p-2 hover:opacity-70 rounded-md transition-colors md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 mx-auto md:mx-0">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName || "Logo"} className="h-8 w-auto object-contain" />
            ) : (
              <ShoppingBag className="h-5 w-5" />
            )}
            <span className="text-sm md:text-base font-bold tracking-tight uppercase hidden md:inline">
              {storeName || "Catálogo"}
            </span>
          </Link>
          <div className="w-9 md:hidden" />
        </div>
      </div>

      {/* Full header content (scrolls normally) */}
      <header className={`border-b ${!headerColor ? 'bg-card' : ''}`} style={colorStyle}>
        <div className="flex flex-col items-center py-6 md:py-8">
          <Link to="/" className="flex flex-col items-center gap-1">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName || "Logo"} className="h-16 w-auto md:h-20 object-contain" />
            ) : (
              <ShoppingBag className="h-10 w-10 md:h-12 md:w-12" />
            )}
            <span className="text-2xl md:text-3xl font-bold tracking-tight uppercase">
              {storeName || "Catálogo"}
            </span>
            <span className={`text-[10px] md:text-xs tracking-[0.3em] uppercase ${headerColor ? 'opacity-70' : 'text-muted-foreground'}`}>
              {storeSubtitle || "Distribuidora"}
            </span>
          </Link>
        </div>

        <div className={`border-t px-4 py-4 md:py-5 text-center space-y-2 ${headerColor ? 'border-white/20 bg-black/10' : 'bg-muted/50'}`}>
          <p className="text-sm md:text-base font-semibold">
            {welcomeText || "❤️ Bem-vindo ao nosso catálogo digital! ❤️"}
          </p>
          <p className={`text-xs md:text-sm italic ${headerColor ? 'opacity-70' : 'text-muted-foreground'}`}>
            {welcomeSubtext || "Escolha seus produtos e faça seu pedido diretamente pelo WhatsApp."}
          </p>
          <p className="text-xs md:text-sm font-semibold uppercase mt-2">
            Clique em "Comprar" para adicionar à sacola
          </p>
        </div>
      </header>
    </>
  );
}
