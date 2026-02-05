import { Link } from "react-router-dom";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <Link
      to={`/produto/${product.slug}`}
      className="group flex flex-col border-r border-b animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-card p-2">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {hasDiscount && (
          <span className="absolute top-1 left-1 rounded bg-sale px-1.5 py-0.5 text-[10px] font-bold text-sale-foreground">
            OFERTA
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-2 py-2 text-center border-t">
        <h3 className="text-xs font-semibold uppercase leading-tight line-clamp-2 group-hover:underline">
          {product.name}
        </h3>
        <p className="mt-1 text-sm font-bold">
          R$ {product.price.toFixed(2).replace(".", ",")}
        </p>
        {hasDiscount && (
          <p className="text-[10px] text-muted-foreground line-through">
            R$ {product.originalPrice!.toFixed(2).replace(".", ",")}
          </p>
        )}
      </div>
    </Link>
  );
}
