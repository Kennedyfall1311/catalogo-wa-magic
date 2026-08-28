import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ShoppingBag, Share2, Check } from "lucide-react";
import { useProductBySlug } from "@/hooks/useProductBySlug";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useSellerPrefix } from "@/hooks/useSellerPrefix";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { CatalogFooter } from "@/components/CatalogFooter";
import { AddToCartDialog } from "@/components/AddToCartDialog";
import { CartFloating } from "@/components/CartFloating";
import { toast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading } = useProductBySlug(slug);
  const { settings, loading: settingsLoading } = useStoreSettings();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { buildPath } = useSellerPrefix();

  const whatsappNumber = settings.whatsapp_number || "5511999999999";

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Produto não encontrado</p>
        <Link to={buildPath("/")} className="text-sm font-medium underline">Voltar ao catálogo</Link>
      </div>
    );
  }

  const hasDiscount = product.original_price && product.original_price > product.price;

  const storeName = settings.store_name || "Catálogo Digital";
  const productUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const productDescription = (product.description ||
    `${product.name} disponível em ${storeName}. Peça agora pelo WhatsApp.`).slice(0, 158);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: productDescription,
    ...(product.image_url ? { image: product.image_url } : {}),
    ...(product.code ? { sku: product.code } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      price: Number(product.price).toFixed(2),
      priceCurrency: "BRL",
      availability:
        product.quantity != null && product.quantity <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      ...(productUrl ? { url: productUrl } : {}),
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{`${product.name} | ${storeName}`}</title>
        <meta name="description" content={productDescription} />
        <meta property="og:title" content={`${product.name} | ${storeName}`} />
        <meta property="og:description" content={productDescription} />
        <meta property="og:type" content="product" />
        {productUrl && <meta property="og:url" content={productUrl} />}
        {product.image_url && <meta property="og:image" content={product.image_url} />}
        {productUrl && <link rel="canonical" href={productUrl} />}
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
      </Helmet>
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center gap-3">
          <Link to={buildPath("/")} className="rounded-full p-2 hover:bg-muted transition-colors">
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
      <CartFloating />
      <WhatsAppFloating whatsappNumber={whatsappNumber} />
      <AddToCartDialog product={product} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
