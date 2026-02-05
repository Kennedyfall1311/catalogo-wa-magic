import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Share2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppFloating } from "@/components/WhatsAppFloating";
import { CatalogFooter } from "@/components/CatalogFooter";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { products } = useProducts();
  const product = products.find((p) => p.slug === slug && p.active);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Produto não encontrado</p>
        <Link to="/" className="text-sm font-medium underline">Voltar ao catálogo</Link>
      </div>
    );
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const url = window.location.href;

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
                src={product.image}
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
              <p className="mt-2 text-muted-foreground">{product.description}</p>

              <div className="mt-4">
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through mr-2">
                    R$ {product.originalPrice!.toFixed(2).replace(".", ",")}
                  </span>
                )}
                <span className="text-2xl font-bold">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={getWhatsAppLink(product.name, product.price, url)}
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

      <CatalogFooter />
      <WhatsAppFloating />
    </div>
  );
}
