import { useState, useMemo } from "react";
import { useOrders, type Order, type OrderItem } from "@/hooks/useOrders";
import { DollarSign, ShoppingCart, Printer, Package, ChevronDown, ChevronUp } from "lucide-react";

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

const formatBRL = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

function OrderRow({ order, onFetchItems }: { order: Order; onFetchItems: (id: string) => Promise<OrderItem[]> }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const handleExpand = async () => {
    if (!expanded && items.length === 0) {
      setLoadingItems(true);
      const data = await onFetchItems(order.id);
      setItems(data);
      setLoadingItems(false);
    }
    setExpanded(!expanded);
  };

  const handlePrint = async () => {
    let printItems = items;
    if (printItems.length === 0) {
      printItems = await onFetchItems(order.id);
      setItems(printItems);
    }
    const itemsHtml = printItems.map((i) =>
      `<div class="row"><span>${i.quantity}x ${i.product_name}${i.product_code ? ` (${i.product_code})` : ""}</span><span class="bold">${formatBRL(i.total_price)}</span></div>`
    ).join("");
    const shippingHtml = order.shipping_fee > 0 ? `<div class="divider"></div><div class="row"><span>Frete</span><span>${formatBRL(order.shipping_fee)}</span></div>` : "";

    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`<html><head><title>Pedido</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;font-size:13px}h2{font-size:16px;margin-bottom:4px}.divider{border-top:1px dashed #ccc;margin:10px 0}.row{display:flex;justify-content:space-between;margin:3px 0}.bold{font-weight:bold}.small{font-size:11px;color:#666}</style></head><body>
      <h2 class="bold">Resumo do Pedido</h2>
      <div class="small">${formatted}</div>
      <div class="divider"></div>
      <div class="row"><span>Cliente:</span><span class="bold">${order.customer_name}</span></div>
      <div class="row"><span>WhatsApp:</span><span>${order.customer_phone}</span></div>
      ${order.customer_cpf_cnpj ? `<div class="row"><span>CPF/CNPJ:</span><span>${order.customer_cpf_cnpj}</span></div>` : ""}
      ${order.payment_method ? `<div class="row"><span>Pagamento:</span><span>${order.payment_method}</span></div>` : ""}
      ${order.notes ? `<div class="row"><span>Obs:</span><span>${order.notes}</span></div>` : ""}
      <div class="divider"></div>
      ${itemsHtml}
      ${shippingHtml}
      <div class="divider"></div>
      <div class="row bold" style="font-size:15px"><span>TOTAL</span><span>${formatBRL(order.total)}</span></div>
      <script>window.print();</script>
    </body></html>`);
    win.document.close();
  };

  const date = new Date(order.created_at);
  const formatted = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleExpand}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{order.customer_name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{formatted} • {order.customer_phone}</p>
        </div>
        <p className="text-sm font-bold shrink-0">{formatBRL(order.total)}</p>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t px-3 py-3 space-y-3 bg-muted/20">
          {order.customer_cpf_cnpj && <p className="text-xs text-muted-foreground">CPF/CNPJ: {order.customer_cpf_cnpj}</p>}
          {order.payment_method && <p className="text-xs text-muted-foreground">Pagamento: {order.payment_method}</p>}
          {order.notes && <p className="text-xs text-muted-foreground">Obs: {order.notes}</p>}

          <div className="space-y-1">
            <p className="text-xs font-semibold">Itens:</p>
            {loadingItems ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum item</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span>{item.quantity}x {item.product_name}{item.product_code ? ` (${item.product_code})` : ""}</span>
                  <span className="font-medium">{formatBRL(item.total_price)}</span>
                </div>
              ))
            )}
            {order.shipping_fee > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>Frete</span><span>{formatBRL(order.shipping_fee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t">
              <span>Total</span><span>{formatBRL(order.total)}</span>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir Resumo
          </button>
        </div>
      )}
    </div>
  );
}

export function SalesDashboard() {
  const { orders, loading, fetchItems } = useOrders();

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = orders.length;

    // Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o) => new Date(o.created_at) >= today);
    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);

    return { totalRevenue, totalOrders, todayOrders: todayOrders.length, todayRevenue };
  }, [orders]);

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Carregando vendas...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={DollarSign} label="Receita Total" value={formatBRL(stats.totalRevenue)} />
        <StatCard icon={ShoppingCart} label="Total Pedidos" value={String(stats.totalOrders)} />
        <StatCard icon={DollarSign} label="Receita Hoje" value={formatBRL(stats.todayRevenue)} />
        <StatCard icon={ShoppingCart} label="Pedidos Hoje" value={String(stats.todayOrders)} />
      </div>

      <h3 className="text-sm font-semibold pt-2">Pedidos Recentes</h3>

      {orders.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground space-y-2">
          <Package className="h-10 w-10 mx-auto opacity-30" />
          <p className="text-sm">Nenhuma venda registrada ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onFetchItems={fetchItems} />
          ))}
        </div>
      )}
    </div>
  );
}
