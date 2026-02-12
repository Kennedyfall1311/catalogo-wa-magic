import { useState, useMemo } from "react";
import { useOrders, type Order, type OrderItem } from "@/hooks/useOrders";
import {
  DollarSign,
  ShoppingCart,
  Printer,
  Package,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Calendar,
  User,
  Phone,
  CreditCard,
  FileText,
  Hash,
} from "lucide-react";

const formatBRL = (v: number) =>
  `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

type Period = "today" | "7d" | "30d" | "all";

function StatCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: any;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
        accent
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border"
      }`}
    >
      <div
        className={`absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-10 ${
          accent ? "bg-primary-foreground" : "bg-primary"
        }`}
      />
      <div className="relative space-y-2">
        <div
          className={`flex items-center gap-2 ${
            accent ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const options: { value: Period; label: string }[] = [
    { value: "today", label: "Hoje" },
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "all", label: "Tudo" },
  ];
  return (
    <div className="flex rounded-lg border bg-muted/50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function OrderRow({
  order,
  onFetchItems,
}: {
  order: Order;
  onFetchItems: (id: string) => Promise<OrderItem[]>;
}) {
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

    const itemsHtml = printItems
      .map(
        (i, idx) =>
          `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${idx + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${i.product_name}${i.product_code ? `<br><small style="color:#888">Cód: ${i.product_code}</small>` : ""}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${formatBRL(i.unit_price)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${formatBRL(i.total_price)}</td>
      </tr>`
      )
      .join("");

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
        <h1>Resumo do Pedido</h1>
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
    <div className="rounded-xl border bg-card overflow-hidden transition-all hover:shadow-sm">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/30"
        onClick={handleExpand}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{order.customer_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatted}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold">{formatBRL(order.total)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? "item" : "itens"}`
              : ""}
          </p>
        </div>
        <div
          className={`shrink-0 h-7 w-7 flex items-center justify-center rounded-full transition-colors ${
            expanded ? "bg-primary/10" : "bg-muted"
          }`}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-primary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
          {/* Customer details */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{order.customer_phone}</span>
            </div>
            {order.customer_cpf_cnpj && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                <span>{order.customer_cpf_cnpj}</span>
              </div>
            )}
            {order.payment_method && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{order.payment_method}</span>
              </div>
            )}
            {order.notes && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground col-span-2">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{order.notes}</span>
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-muted/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Produto</span>
              <span className="text-center">Qtd</span>
              <span className="text-right">Total</span>
            </div>
            {loadingItems ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">Carregando...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">Nenhum item</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 border-t text-xs"
                >
                  <div className="min-w-0">
                    <span className="truncate block">{item.product_name}</span>
                    {item.product_code && (
                      <span className="text-[10px] text-muted-foreground">
                        Cód: {item.product_code}
                      </span>
                    )}
                  </div>
                  <span className="text-center tabular-nums text-muted-foreground w-10">
                    {item.quantity}x
                  </span>
                  <span className="text-right font-semibold tabular-nums w-20">
                    {formatBRL(item.total_price)}
                  </span>
                </div>
              ))
            )}
            {/* Totals */}
            <div className="border-t bg-muted/30 px-3 py-2 space-y-1">
              {order.shipping_fee > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Frete</span>
                  <span className="tabular-nums">{formatBRL(order.shipping_fee)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatBRL(order.total)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
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
  const [period, setPeriod] = useState<Period>("all");

  const filteredOrders = useMemo(() => {
    if (period === "all") return orders;
    const now = new Date();
    let cutoff: Date;
    if (period === "today") {
      cutoff = new Date(now);
      cutoff.setHours(0, 0, 0, 0);
    } else if (period === "7d") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return orders.filter((o) => new Date(o.created_at) >= cutoff);
  }, [orders, period]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = filteredOrders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(
      (o) => new Date(o.created_at) >= today
    );
    const todayRevenue = todayOrders.reduce(
      (s, o) => s + Number(o.total),
      0
    );

    return {
      totalRevenue,
      totalOrders,
      avgTicket,
      todayOrders: todayOrders.length,
      todayRevenue,
    };
  }, [filteredOrders, orders]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando vendas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Painel de Vendas
          </h2>
          <p className="text-xs text-muted-foreground">
            Acompanhe o desempenho do seu catálogo
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={DollarSign}
          label="Receita do Período"
          value={formatBRL(stats.totalRevenue)}
          accent
        />
        <StatCard
          icon={ShoppingCart}
          label="Pedidos"
          value={String(stats.totalOrders)}
        />
        <StatCard
          icon={TrendingUp}
          label="Ticket Médio"
          value={formatBRL(stats.avgTicket)}
        />
        <StatCard
          icon={DollarSign}
          label="Receita Hoje"
          value={formatBRL(stats.todayRevenue)}
        />
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            Pedidos Recentes
          </h3>
          <span className="text-xs text-muted-foreground rounded-full bg-muted px-2.5 py-0.5 font-medium">
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Package className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma venda encontrada
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {period !== "all"
                  ? "Tente outro período"
                  : "As vendas aparecerão aqui"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onFetchItems={fetchItems}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
