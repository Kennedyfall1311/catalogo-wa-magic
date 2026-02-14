import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Share2, Check } from "lucide-react";
import { useProductBySlug } from "@/hooks/useProductBySlug";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { CatalogFooter } from "@/components/CatalogFooter";
import { AddToCartDialog } from "@/components/AddToCartDialog";
import { toast } from "@/hooks/use-toast";

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
                onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
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
              {settings.catalog_show_reference === "true" && product.reference && (
                <p className="text-sm text-muted-foreground">Referência: {product.reference}</p>
              )}
              {settings.catalog_show_manufacturer_code === "true" && product.manufacturer_code && (
                <p className="text-sm text-muted-foreground">Cód. Fabricante: {product.manufacturer_code}</p>
              )}
              {settings.catalog_show_unit_of_measure === "true" && product.unit_of_measure && (
                <p className="text-sm text-muted-foreground">Unidade: {product.unit_of_measure}</p>
              )}
              {settings.catalog_show_quantity === "true" && product.quantity != null && (
                <p className="text-sm text-muted-foreground">Quantidade: {product.quantity}</p>
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
                {settings.catalog_show_installments === "true" && (() => {
                  const count = Number(settings.catalog_installments_count) || 3;
                  return count > 1 ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      {count}x de R$ {(product.price / count).toFixed(2).replace(".", ",")}
                    </p>
                  ) : null;
                })()}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setDialogOpen(true)}
                  className={`flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition-colors shadow-sm w-full ${settings.button_color ? 'text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  style={settings.button_color ? { backgroundColor: settings.button_color } : undefined}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Comprar
                </button>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url).then(() => {
                      toast({ title: "Link copiado!", description: "Compartilhe com quem quiser." });
                    });
                  }}
                  className="flex items-center justify-center gap-2 rounded-full border px-6 py-3 font-medium text-sm w-full hover:bg-muted transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar produto
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
