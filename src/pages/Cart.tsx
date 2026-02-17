import { Link } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useSellerPrefix } from "@/hooks/useSellerPrefix";
import { CatalogFooter } from "@/components/CatalogFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const { settings } = useStoreSettings();
  const { buildPath } = useSellerPrefix();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center gap-3">
          <Link to={buildPath("/")} className="rounded-full p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-medium">Minha Sacola</span>
        </div>
      </header>

      <main className="flex-1 container max-w-2xl py-6">
        {items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground space-y-3">
            <ShoppingBag className="h-12 w-12 mx-auto opacity-40" />
            <p className="text-lg">Sua sacola está vazia</p>
            <Link to="/" className="text-sm font-medium underline">
              Voltar ao catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  <img
                    src={item.product.image_url || "/placeholder.svg"}
                    alt={item.product.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-semibold uppercase leading-tight line-clamp-2">
                    {item.product.name}
                  </p>
                  <p className="text-sm font-bold">
                    R$ {(Number(item.product.price) * item.quantity).toFixed(2).replace(".", ",")}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border hover:bg-muted transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remover item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
              </div>

              <Link to={buildPath("/checkout")}>
                <Button className="w-full rounded-full" size="lg">
                  Prosseguir
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>

              <button
                onClick={clearCart}
                className="w-full text-center text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Limpar sacola
              </button>
            </div>
          </div>
        )}
      </main>

      <CatalogFooter storeName={settings.store_name} footerColor={settings.footer_color} />
    </div>
  );
}
