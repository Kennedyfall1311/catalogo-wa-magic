import { Link } from "react-router-dom";
import type { DbProduct } from "@/hooks/useDbProducts";
import { MessageCircle } from "lucide-react";

interface ProductCardProps {
  product: DbProduct;
  index: number;
  whatsappNumber: string;
}

export function ProductCard({ product, index, whatsappNumber }: ProductCardProps) {
  const hasDiscount = product.original_price && product.original_price > product.price;

  const whatsappMessage = encodeURIComponent(
    `Olá, quero pedir este produto:\n\nProduto: ${product.name}\nCódigo: ${product.code || "N/A"}\nPreço: R$ ${Number(product.price).toFixed(2).replace(".", ",")}`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div
      className="group flex flex-col border-r border-b animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Link to={`/produto/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-card p-2">
          <img
            src={product.image_url || "/placeholder.svg"}
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
      </Link>

      <div className="px-2 py-2 text-center border-t space-y-1">
        <Link to={`/produto/${product.slug}`}>
          <h3 className="text-xs font-semibold uppercase leading-tight line-clamp-2 hover:underline">
            {product.name}
          </h3>
        </Link>
        {product.code && (
          <p className="text-[10px] text-muted-foreground">Cód: {product.code}</p>
        )}
        <p className="text-sm font-bold">
          R$ {Number(product.price).toFixed(2).replace(".", ",")}
        </p>
        {hasDiscount && (
          <p className="text-[10px] text-muted-foreground line-through">
            R$ {Number(product.original_price!).toFixed(2).replace(".", ",")}
          </p>
        )}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center justify-center gap-1 rounded-md bg-whatsapp px-2 py-1.5 text-[11px] font-semibold text-whatsapp-foreground transition-colors hover:bg-whatsapp-hover"
        >
          <MessageCircle className="h-3 w-3" />
          Pedir no WhatsApp
        </a>
      </div>
    </div>
  );
}
