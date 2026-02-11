import { useState, useMemo } from "react";
import { useOrders, type Order, type OrderItem } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, ShoppingCart, Clock, CheckCircle, Package, Eye, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  { value: "shipped", label: "Enviado", color: "bg-purple-100 text-purple-800" },
  { value: "delivered", label: "Entregue", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelado", color: "bg-red-100 text-red-800" },
];

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${opt.color}`}>{opt.label}</span>;
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function OrderRow({ order, onStatusChange, onFetchItems }: { order: Order; onStatusChange: (id: string, status: string) => void; onFetchItems: (id: string) => Promise<OrderItem[]> }) {
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

  const date = new Date(order.created_at);
  const formatted = `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  const formatBRL = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleExpand}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">{order.customer_name}</p>
            <StatusBadge status={order.status} />
          </div>
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
              <p className="text-xs text-muted-foreground">Nenhum item registrado</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span>{item.quantity}x {item.product_name} {item.product_code ? `(${item.product_code})` : ""}</span>
                  <span className="font-medium">{formatBRL(item.total_price)}</span>
                </div>
              ))
            )}
            {order.shipping_fee > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>Frete</span>
                <span>{formatBRL(order.shipping_fee)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Select value={order.status} onValueChange={(v) => onStatusChange(order.id, v)}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

export function SalesDashboard() {
  const { orders, loading, updateStatus, fetchItems } = useOrders();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const stats = useMemo(() => {
    const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    return { totalRevenue, totalOrders, pending, delivered };
  }, [orders]);

  const filtered = useMemo(() => {
    if (filterStatus === "all") return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Carregando vendas...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={DollarSign} label="Receita Total" value={formatBRL(stats.totalRevenue)} />
        <StatCard icon={ShoppingCart} label="Total Pedidos" value={String(stats.totalOrders)} />
        <StatCard icon={Clock} label="Pendentes" value={String(stats.pending)} />
        <StatCard icon={CheckCircle} label="Entregues" value={String(stats.delivered)} />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Filtrar:</span>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground space-y-2">
          <Package className="h-10 w-10 mx-auto opacity-30" />
          <p className="text-sm">Nenhuma venda encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} onStatusChange={updateStatus} onFetchItems={fetchItems} />
          ))}
        </div>
      )}
    </div>
  );
}
