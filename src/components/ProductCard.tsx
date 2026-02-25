import { useState } from "react";
import { Link } from "react-router-dom";
import type { DbProduct } from "@/hooks/useDbProducts";
import { ShoppingBag, Share2 } from "lucide-react";
import { AddToCartDialog } from "@/components/AddToCartDialog";
import { toast } from "@/hooks/use-toast";
import { useSellerPrefix } from "@/hooks/useSellerPrefix";

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
  const { buildPath } = useSellerPrefix();
  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <>
      <div className="group flex flex-col border-r border-b h-full">
        <Link to={buildPath(`/produto/${product.slug}`)}>
          <div className="relative aspect-square overflow-hidden bg-card p-2">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
            />
            {hasDiscount && (
              <span className="absolute top-1 left-1 rounded bg-sale px-1.5 py-0.5 text-[10px] font-bold text-sale-foreground">
                OFERTA
              </span>
            )}
          </div>
        </Link>

        <div className="flex flex-col flex-1 px-2 py-3 text-center border-t gap-1">
          <Link to={buildPath(`/produto/${product.slug}`)}>
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
          {catalogSettings.catalog_show_reference === "true" && product.reference && (
            <p className={`${detailSize} text-muted-foreground`}>Ref: {product.reference}</p>
          )}
          {catalogSettings.catalog_show_manufacturer_code === "true" && product.manufacturer_code && (
            <p className={`${detailSize} text-muted-foreground`}>Fab: {product.manufacturer_code}</p>
          )}
          {catalogSettings.catalog_show_unit_of_measure === "true" && product.unit_of_measure && (
            <p className={`${detailSize} text-muted-foreground`}>Un: {product.unit_of_measure}</p>
          )}
          {catalogSettings.catalog_show_quantity === "true" && product.quantity != null && (
            <p className={`${detailSize} text-muted-foreground`}>Qtd: {product.quantity}</p>
          )}

          <div className="mt-auto pt-1 flex gap-1.5">
            <button
              onClick={() => setDialogOpen(true)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${buttonColor ? 'text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
              style={buttonColor ? { backgroundColor: buttonColor } : undefined}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Comprar
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}${buildPath(`/produto/${product.slug}`)}`;
                navigator.clipboard.writeText(url).then(() => {
                  toast({ title: "Link copiado!", description: url });
                });
              }}
              className="flex items-center justify-center rounded-md border px-2 py-2 text-muted-foreground hover:bg-muted transition-colors"
              title="Copiar link do produto"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {dialogOpen && <AddToCartDialog product={product} open={dialogOpen} onOpenChange={setDialogOpen} />}
    </>
  );
}
