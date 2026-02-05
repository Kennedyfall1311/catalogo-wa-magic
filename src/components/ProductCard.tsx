import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import type { Product } from "@/types/product";
import { getWhatsAppLink } from "@/lib/whatsapp";

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Link to={`/produto/${product.slug}`} className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 rounded-full bg-sale px-2.5 py-0.5 text-xs font-semibold text-sale-foreground">
            OFERTA
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/produto/${product.slug}`}>
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:underline">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                R$ {product.originalPrice!.toFixed(2).replace(".", ",")}
              </span>
            )}
            <p className="text-lg font-bold">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </p>
          </div>

          <a
            href={getWhatsAppLink(product.name, product.price, window.location.origin + "/produto/" + product.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-whatsapp px-3.5 py-2 text-xs font-semibold text-whatsapp-foreground transition-colors hover:bg-whatsapp-hover shadow-sm"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pedir</span>
          </a>
        </div>
      </div>
    </div>
  );
}
