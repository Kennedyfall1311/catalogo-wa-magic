import { Menu, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

interface CatalogHeaderProps {
  storeName?: string;
  storeSubtitle?: string;
  logoUrl?: string;
  welcomeText?: string;
  welcomeSubtext?: string;
}

export function CatalogHeader({ storeName, storeSubtitle, logoUrl, welcomeText, welcomeSubtext }: CatalogHeaderProps) {
  const { totalItems } = useCart();

  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between px-4 py-2 md:hidden">
        <button className="p-2 hover:bg-muted rounded-md transition-colors" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName || "Logo"} className="h-6 w-auto object-contain" />
          ) : (
            <ShoppingBag className="h-5 w-5" />
          )}
        </Link>
        <Link to="/sacola" className="relative p-2 hover:bg-muted rounded-md transition-colors">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </Link>
      </div>

      <div className="flex flex-col items-center py-6 md:py-8 relative">
        <Link to="/sacola" className="absolute right-4 top-4 hidden md:flex relative p-2 hover:bg-muted rounded-md transition-colors">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </Link>
        <Link to="/" className="flex flex-col items-center gap-1">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName || "Logo"} className="h-16 w-auto md:h-20 object-contain" />
          ) : (
            <ShoppingBag className="h-10 w-10 md:h-12 md:w-12" />
          )}
          <span className="text-2xl md:text-3xl font-bold tracking-tight uppercase">
            {storeName || "Catálogo"}
          </span>
          <span className="text-[10px] md:text-xs tracking-[0.3em] text-muted-foreground uppercase">
            {storeSubtitle || "Distribuidora"}
          </span>
        </Link>
      </div>

      <div className="border-t bg-muted/50 px-4 py-4 md:py-5 text-center space-y-2">
        <p className="text-sm md:text-base font-semibold">
          {welcomeText || "❤️ Bem-vindo ao nosso catálogo digital! ❤️"}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground italic">
          {welcomeSubtext || "Escolha seus produtos e faça seu pedido diretamente pelo WhatsApp."}
        </p>
        <p className="text-xs md:text-sm font-semibold uppercase mt-2">
          Clique em "Comprar" para adicionar à sacola
        </p>
      </div>
    </header>
  );
}
