import { Instagram, Facebook, Share2, ShoppingBag } from "lucide-react";

export function CatalogFooter() {
  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: "Catálogo", url: window.location.origin });
    } else {
      navigator.clipboard.writeText(window.location.origin);
    }
  };

  return (
    <footer className="mt-16 border-t bg-card">
      <div className="container py-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="font-bold tracking-tight">Catálogo</span>
          </div>

          <div className="flex gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border p-2.5 transition-colors hover:bg-muted"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border p-2.5 transition-colors hover:bg-muted"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <button
              onClick={shareLink}
              className="rounded-full border p-2.5 transition-colors hover:bg-muted"
              aria-label="Compartilhar"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Catálogo Digital. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
