import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useProductBySlug } from "@/hooks/useProductBySlug";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { CatalogFooter } from "@/components/CatalogFooter";
import { AddToCartDialog } from "@/components/AddToCartDialog";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading } = useProductBySlug(slug);
  const { settings } = useStoreSettings();
  const [dialogOpen, setDialogOpen] = useState(false);

  const whatsappNumber = settings.whatsapp_number || "5511999999999";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Produto não encontrado</p>
        <Link to="/" className="text-sm font-medium underline">Voltar ao catálogo</Link>
      </div>
    );
  }

  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="rounded-full p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-medium truncate">{product.name}</span>
        </div>
      </header>

      <main className="flex-1">
        <div className="container max-w-3xl py-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-col">
              {hasDiscount && (
                <span className="self-start rounded-full bg-sale px-3 py-1 text-xs font-semibold text-sale-foreground mb-3">
                  OFERTA
                </span>
              )}

              <h1 className="text-2xl font-bold" style={settings.text_color ? { color: settings.text_color } : undefined}>{product.name}</h1>
              {product.code && (
                <p className="text-sm text-muted-foreground mt-1">Código: {product.code}</p>
              )}
              {settings.catalog_show_description === "true" && product.description && (
                <p className="mt-2 text-muted-foreground">{product.description}</p>
              )}
              {settings.catalog_show_reference === "true" && (product as any).reference && (
                <p className="text-sm text-muted-foreground">Referência: {(product as any).reference}</p>
              )}
              {settings.catalog_show_manufacturer_code === "true" && (product as any).manufacturer_code && (
                <p className="text-sm text-muted-foreground">Cód. Fabricante: {(product as any).manufacturer_code}</p>
              )}
              {settings.catalog_show_unit_of_measure === "true" && (product as any).unit_of_measure && (
                <p className="text-sm text-muted-foreground">Unidade: {(product as any).unit_of_measure}</p>
              )}
              {settings.catalog_show_quantity === "true" && (product as any).quantity != null && (
                <p className="text-sm text-muted-foreground">Quantidade: {(product as any).quantity}</p>
              )}

              <div className="mt-4">
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through mr-2">
                    R$ {Number(product.original_price!).toFixed(2).replace(".", ",")}
                  </span>
                )}
                <span className="text-2xl font-bold" style={settings.price_color ? { color: settings.price_color } : undefined}>
                  R$ {Number(product.price).toFixed(2).replace(".", ",")}
                </span>
                {settings.catalog_show_installments === "true" && settings.catalog_installments_count && Number(settings.catalog_installments_count) > 1 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {Number(settings.catalog_installments_count)}x de R$ {(product.price / Number(settings.catalog_installments_count)).toFixed(2).replace(".", ",")}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setDialogOpen(true)}
                  className={`flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition-colors shadow-sm w-full ${settings.button_color ? 'text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  style={settings.button_color ? { backgroundColor: settings.button_color } : undefined}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Comprar
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CatalogFooter storeName={settings.store_name} />
      <WhatsAppFloating whatsappNumber={whatsappNumber} />
      <AddToCartDialog product={product} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
