import { Menu, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export function CatalogHeader() {
  return (
    <header className="border-b bg-card">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 md:hidden">
        <button className="p-2 hover:bg-muted rounded-md transition-colors" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center">
          <ShoppingBag className="h-5 w-5" />
        </Link>
        <div className="w-9" /> {/* spacer */}
      </div>

      {/* Logo centered */}
      <div className="flex flex-col items-center py-6 md:py-8">
        <Link to="/" className="flex flex-col items-center gap-1">
          <ShoppingBag className="h-10 w-10 md:h-12 md:w-12" />
          <span className="text-2xl md:text-3xl font-bold tracking-tight uppercase">Catálogo</span>
          <span className="text-[10px] md:text-xs tracking-[0.3em] text-muted-foreground uppercase">Distribuidora</span>
        </Link>
      </div>

      {/* Info banner */}
      <div className="border-t bg-muted/50 px-4 py-4 md:py-5 text-center space-y-2">
        <p className="text-sm md:text-base font-semibold">
          ❤️ Bem-vindo ao nosso catálogo digital! ❤️
        </p>
        <p className="text-xs md:text-sm text-muted-foreground italic">
          Escolha seus produtos e faça seu pedido diretamente pelo WhatsApp.
          <br className="hidden sm:block" />
          Nosso atendimento irá auxiliar com dúvidas, prazo de entrega e formas de pagamento.
        </p>
        <p className="text-xs md:text-sm font-semibold uppercase mt-2">
          Após a compra, clique em finalizar pedido e envie para o WhatsApp
        </p>
      </div>
    </header>
  );
}
