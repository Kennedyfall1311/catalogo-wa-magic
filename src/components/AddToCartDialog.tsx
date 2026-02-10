import { useState } from "react";
import { ShoppingBag, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import type { DbProduct } from "@/hooks/useDbProducts";
import { toast } from "@/hooks/use-toast";

interface AddToCartDialogProps {
  product: DbProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToCartDialog({ product, open, onOpenChange }: AddToCartDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const hasDiscount = product.original_price && product.original_price > product.price;

  const handleAdd = () => {
    addItem(product, quantity);
    toast({
      title: "Adicionado à sacola!",
      description: `${quantity}x ${product.name}`,
    });
    setQuantity(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Adicionar à sacola</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="aspect-square w-48 overflow-hidden rounded-lg bg-muted">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          </div>

          <h3 className="text-sm font-semibold uppercase text-center leading-tight">
            {product.name}
          </h3>

          {product.code && (
            <p className="text-xs text-muted-foreground">{product.code}</p>
          )}

          <div className="text-center">
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                de R$ {Number(product.original_price!).toFixed(2).replace(".", ",")}
              </p>
            )}
            <p className="text-lg font-bold">
              por R$ {Number(product.price).toFixed(2).replace(".", ",")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted transition-colors"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-lg font-semibold tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted transition-colors"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ShoppingBag className="h-5 w-5" />
            Adicionar à sacola
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
