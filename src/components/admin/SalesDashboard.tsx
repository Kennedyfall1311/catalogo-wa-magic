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

    const storeName = "Catálogo";
    const itemsHtml = printItems.map((i, idx) =>
      `<tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee">${idx + 1}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee">${i.product_name}${i.product_code ? `<br><small style="color:#888">Cód: ${i.product_code}</small>` : ""}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${formatBRL(i.unit_price)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${formatBRL(i.total_price)}</td>
      </tr>`
    ).join("");

    const win = window.open("", "_blank", "width=600,height=700");
    if (!win) return;
    win.document.write(`<html><head><title>Pedido - ${order.customer_name}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; font-size: 13px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header h1 { font-size: 18px; margin: 0 0 4px 0; }
        .header p { color: #666; margin: 0; font-size: 12px; }
        .section { margin: 16px 0; }
        .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 8px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
        .info-row { display: flex; gap: 6px; }
        .info-label { color: #888; min-width: 80px; }
        .info-value { font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th { background: #f5f5f5; padding: 6px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; }
        .totals { text-align: right; margin-top: 12px; }
        .totals .row { display: flex; justify-content: flex-end; gap: 20px; margin: 3px 0; }
        .totals .grand { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 6px; margin-top: 6px; }
        .footer { margin-top: 30px; text-align: center; color: #aaa; font-size: 10px; border-top: 1px solid #eee; padding-top: 10px; }
      </style></head><body>
      <div class="header">
        <h1>📋 Resumo do Pedido</h1>
        <p>${formatted}</p>
      </div>
      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Cliente:</span><span class="info-value">${order.customer_name}</span></div>
          <div class="info-row"><span class="info-label">WhatsApp:</span><span class="info-value">${order.customer_phone}</span></div>
          ${order.customer_cpf_cnpj ? `<div class="info-row"><span class="info-label">CPF/CNPJ:</span><span class="info-value">${order.customer_cpf_cnpj}</span></div>` : ""}
          ${order.payment_method ? `<div class="info-row"><span class="info-label">Pagamento:</span><span class="info-value">${order.payment_method}</span></div>` : ""}
        </div>
        ${order.notes ? `<div style="margin-top:8px"><span class="info-label">Observações:</span> ${order.notes}</div>` : ""}
      </div>
      <div class="section">
        <div class="section-title">Itens do Pedido</div>
        <table>
          <thead><tr>
            <th>#</th><th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Unit.</th><th style="text-align:right">Total</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      <div class="totals">
        <div class="row"><span>Subtotal:</span><span>${formatBRL(order.subtotal)}</span></div>
        ${order.shipping_fee > 0 ? `<div class="row"><span>Frete:</span><span>${formatBRL(order.shipping_fee)}</span></div>` : ""}
        <div class="row grand"><span>TOTAL:</span><span>${formatBRL(order.total)}</span></div>
      </div>
      <div class="footer">Pedido gerado automaticamente</div>
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
