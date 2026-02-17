import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useSellerPrefix } from "@/hooks/useSellerPrefix";

export function CartFloating() {
  const { totalItems } = useCart();
  const { buildPath } = useSellerPrefix();

  if (totalItems === 0) return null;

  return (
    <Link
      to={buildPath("/sacola")}
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label={`Sacola com ${totalItems} ${totalItems === 1 ? "item" : "itens"}`}
    >
      <ShoppingBag className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-sale text-[11px] font-bold text-sale-foreground">
        {totalItems}
      </span>
    </Link>
  );
}
