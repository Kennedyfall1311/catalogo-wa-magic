import { Instagram, Facebook, Share2, ShoppingBag } from "lucide-react";

interface CatalogFooterProps {
  storeName?: string;
  footerColor?: string;
}

export function CatalogFooter({ storeName, footerColor }: CatalogFooterProps) {
  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: storeName || "Catálogo", url: window.location.origin });
    } else {
      navigator.clipboard.writeText(window.location.origin);
    }
  };

  const colorStyle = footerColor ? { backgroundColor: footerColor, color: '#fff' } : undefined;

  return (
    <footer className={`mt-8 border-t ${!footerColor ? 'bg-card' : ''}`} style={colorStyle}>
      <div className="container py-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="font-bold tracking-tight">{storeName || "Catálogo"}</span>
          </div>

          <div className="flex gap-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={`rounded-full border p-2.5 transition-colors hover:opacity-70 ${footerColor ? 'border-white/30' : 'hover:bg-muted'}`} aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={`rounded-full border p-2.5 transition-colors hover:opacity-70 ${footerColor ? 'border-white/30' : 'hover:bg-muted'}`} aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
            <button onClick={shareLink} className={`rounded-full border p-2.5 transition-colors hover:opacity-70 ${footerColor ? 'border-white/30' : 'hover:bg-muted'}`} aria-label="Compartilhar">
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <p className={`text-xs ${footerColor ? 'opacity-60' : 'text-muted-foreground'}`}>
            © {new Date().getFullYear()} {storeName || "Catálogo Digital"}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
