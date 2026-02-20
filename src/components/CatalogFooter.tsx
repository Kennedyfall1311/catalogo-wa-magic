import { Instagram, Facebook, Share2, ShoppingBag, Globe, Youtube } from "lucide-react";

interface CatalogFooterProps {
  storeName?: string;
  footerColor?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialTiktok?: string;
  socialYoutube?: string;
  socialWebsite?: string;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.01a8.27 8.27 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.42z" />
    </svg>
  );
}

export function CatalogFooter({
  storeName,
  footerColor,
  socialInstagram,
  socialFacebook,
  socialTiktok,
  socialYoutube,
  socialWebsite,
}: CatalogFooterProps) {
  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: storeName || "Catálogo", url: window.location.origin });
    } else {
      navigator.clipboard.writeText(window.location.origin);
    }
  };

  const colorStyle = footerColor ? { backgroundColor: footerColor, color: '#fff' } : undefined;
  const iconClass = `rounded-full border p-2.5 transition-colors hover:opacity-70 ${footerColor ? 'border-white/30' : 'hover:bg-muted'}`;

  const hasSocial = socialInstagram || socialFacebook || socialTiktok || socialYoutube || socialWebsite;

  return (
    <footer className={`mt-8 border-t ${!footerColor ? 'bg-card' : ''}`} style={colorStyle}>
      <div className="container py-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="font-bold tracking-tight uppercase">{storeName || "Catálogo"}</span>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            {socialInstagram && (
              <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className={iconClass} aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {socialFacebook && (
              <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className={iconClass} aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {socialTiktok && (
              <a href={socialTiktok} target="_blank" rel="noopener noreferrer" className={iconClass} aria-label="TikTok">
                <TikTokIcon className="h-4 w-4" />
              </a>
            )}
            {socialYoutube && (
              <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className={iconClass} aria-label="YouTube">
                <Youtube className="h-4 w-4" />
              </a>
            )}
            {socialWebsite && (
              <a href={socialWebsite} target="_blank" rel="noopener noreferrer" className={iconClass} aria-label="Site">
                <Globe className="h-4 w-4" />
              </a>
            )}
            <button onClick={shareLink} className={iconClass} aria-label="Compartilhar">
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
