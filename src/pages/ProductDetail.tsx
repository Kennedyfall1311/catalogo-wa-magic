import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Share2, ShoppingBag } from "lucide-react";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { CatalogFooter } from "@/components/CatalogFooter";
import { AddToCartDialog } from "@/components/AddToCartDialog";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { products } = useDbProducts();
  const { settings } = useStoreSettings();
  const [dialogOpen, setDialogOpen] = useState(false);
  const product = products.find((p) => p.slug === slug && p.active);

  const whatsappNumber = settings.whatsapp_number || "5511999999999";

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Produto não encontrado</p>
        <Link to="/" className="text-sm font-medium underline">Voltar ao catálogo</Link>
      </div>
    );
  }

  const hasDiscount = product.original_price && product.original_price > product.price;
  const url = window.location.href;

  const whatsappMessage = encodeURIComponent(
    `Olá, quero pedir este produto:\n\nProduto: ${product.name}\nCódigo: ${product.code || "N/A"}\nPreço: R$ ${Number(product.price).toFixed(2).replace(".", ",")}`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

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

              <h1 className="text-2xl font-bold">{product.name}</h1>
              {product.code && (
                <p className="text-sm text-muted-foreground mt-1">Código: {product.code}</p>
              )}
              <p className="mt-2 text-muted-foreground">{product.description}</p>

              <div className="mt-4">
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through mr-2">
                    R$ {Number(product.original_price!).toFixed(2).replace(".", ",")}
                  </span>
                )}
                <span className="text-2xl font-bold">
                  R$ {Number(product.price).toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => setDialogOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Comprar
                </button>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3 font-semibold text-whatsapp-foreground transition-colors hover:bg-whatsapp-hover shadow-sm"
                >
                  <MessageCircle className="h-5 w-5" />
                  Pedir no WhatsApp
                </a>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: product.name, url });
                    } else {
                      navigator.clipboard.writeText(url);
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-full border px-6 py-3 font-medium transition-colors hover:bg-muted"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
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
