import { useState } from "react";
import { Link } from "react-router-dom";
import type { DbProduct } from "@/hooks/useDbProducts";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { AddToCartDialog } from "@/components/AddToCartDialog";

interface ProductCardProps {
  product: DbProduct;
  index: number;
  whatsappNumber: string;
  buttonColor?: string;
  textColor?: string;
  priceColor?: string;
  catalogSettings?: Record<string, string>;
}

export function ProductCard({ product, index, whatsappNumber, buttonColor, textColor, priceColor, catalogSettings = {} }: ProductCardProps) {
  const nameSize = "text-[11px] md:text-xs";
  const priceSize = "text-sm";
  const detailSize = "text-[10px]";
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasDiscount = product.original_price && product.original_price > product.price;

  const whatsappMessage = encodeURIComponent(
    `Olá, quero pedir este produto:\n\nProduto: ${product.name}\nCódigo: ${product.code || "N/A"}\nPreço: R$ ${Number(product.price).toFixed(2).replace(".", ",")}`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <>
      <div
        className="group flex flex-col border-r border-b"
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

        <div className="px-2 py-3 text-center border-t space-y-1">
          <Link to={`/produto/${product.slug}`}>
            <h3 className={`${nameSize} font-semibold uppercase leading-tight line-clamp-2 hover:underline`} style={textColor ? { color: textColor } : undefined}>
              {product.name}
            </h3>
          </Link>
          {product.code && (
            <p className={`${detailSize} text-muted-foreground`}>Cód: {product.code}</p>
          )}
          {hasDiscount && (
            <p className={`${detailSize} text-muted-foreground line-through`}>
              de R$ {Number(product.original_price!).toFixed(2).replace(".", ",")}
            </p>
          )}
          <p className={`${priceSize} font-bold`} style={priceColor ? { color: priceColor } : undefined}>
            R$ {Number(product.price).toFixed(2).replace(".", ",")}
          </p>
          {catalogSettings.catalog_show_installments === "true" && (() => {
            const count = Number(catalogSettings.catalog_installments_count) || 3;
            return count > 1 ? (
              <p className={`${detailSize} text-muted-foreground`}>
                {count}x de R$ {(product.price / count).toFixed(2).replace(".", ",")}
              </p>
            ) : null;
          })()}
          {catalogSettings.catalog_show_description === "true" && product.description && (
            <p className={`${detailSize} text-muted-foreground line-clamp-2`}>{product.description}</p>
          )}
          {catalogSettings.catalog_show_reference === "true" && (product as any).reference && (
            <p className={`${detailSize} text-muted-foreground`}>Ref: {(product as any).reference}</p>
          )}
          {catalogSettings.catalog_show_manufacturer_code === "true" && (product as any).manufacturer_code && (
            <p className={`${detailSize} text-muted-foreground`}>Fab: {(product as any).manufacturer_code}</p>
          )}
          {catalogSettings.catalog_show_unit_of_measure === "true" && (product as any).unit_of_measure && (
            <p className={`${detailSize} text-muted-foreground`}>Un: {(product as any).unit_of_measure}</p>
          )}
          {catalogSettings.catalog_show_quantity === "true" && (product as any).quantity != null && (
            <p className={`${detailSize} text-muted-foreground`}>Qtd: {(product as any).quantity}</p>
          )}
          <button
            onClick={() => setDialogOpen(true)}
            className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${buttonColor ? 'text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
            style={buttonColor ? { backgroundColor: buttonColor } : undefined}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Comprar
          </button>
        </div>
      </div>

      {dialogOpen && <AddToCartDialog product={product} open={dialogOpen} onOpenChange={setDialogOpen} />}
    </>
  );
}
