import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { CatalogFooter } from "@/components/CatalogFooter";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { usePaymentConditions } from "@/hooks/usePaymentConditions";

interface CustomerData {
  name: string;
  phone: string;
  cpfCnpj: string;
  notes: string;
}

export default function Checkout() {
  const { items, totalPrice } = useCart();
  const { settings } = useStoreSettings();
  const { conditions } = usePaymentConditions();
  const whatsappNumber = settings.whatsapp_number || "5511999999999";

  const paymentEnabled = settings.payment_conditions_enabled === "true";
  const activeConditions = conditions.filter((c) => c.active);

  const shippingEnabled = settings.shipping_enabled === "true";
  const shippingFee = shippingEnabled ? Number(settings.shipping_fee || 0) : 0;

  const minimumOrderEnabled = settings.minimum_order_enabled === "true";
  const minimumOrderValue = Number(settings.minimum_order_value || 0);

  const finalTotal = totalPrice + shippingFee;
  const belowMinimum = minimumOrderEnabled && minimumOrderValue > 0 && totalPrice < minimumOrderValue;

  const [selectedPayment, setSelectedPayment] = useState("");
  const [data, setData] = useState<CustomerData>({ name: "", phone: "", cpfCnpj: "", notes: "" });

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
          <div className="container flex h-14 items-center gap-3">
            <Link to="/" className="rounded-full p-2 hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-sm font-medium">Suas Informações</span>
          </div>
        </header>
        <main className="flex-1 container max-w-2xl py-20 text-center text-muted-foreground space-y-3">
          <p className="text-lg">Sua sacola está vazia</p>
          <Link to="/" className="text-sm font-medium underline">Voltar ao catálogo</Link>
        </main>
        <CatalogFooter storeName={settings.store_name} footerColor={settings.footer_color} />
      </div>
    );
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    if (digits.length <= 11) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  const update = (field: keyof CustomerData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const isValid =
    data.name.trim().length >= 2 &&
    data.phone.replace(/\D/g, "").length >= 10 &&
    (!paymentEnabled || !activeConditions.length || selectedPayment !== "") &&
    !belowMinimum;

  const formatBRL = (v: number) => v.toFixed(2).replace(".", ",");

  const handleSubmit = () => {
    if (!isValid) return;

    const paymentInfo = selectedPayment ? `\n*Pagamento:* ${selectedPayment}` : "";
    const shippingInfo = shippingEnabled && shippingFee > 0 ? `\n*Frete:* R$ ${formatBRL(shippingFee)}` : "";
    const customerInfo = `*Cliente:* ${data.name}\n*WhatsApp:* ${data.phone}${data.cpfCnpj ? `\n*CPF/CNPJ:* ${data.cpfCnpj}` : ""}${paymentInfo}${data.notes ? `\n*Observações:* ${data.notes}` : ""}`;

    const itemsList = items
      .map(
        (i) =>
          `• ${i.quantity}x ${i.product.name} (Cód: ${i.product.code || "N/A"}) - R$ ${formatBRL(Number(i.product.price) * i.quantity)}`
      )
      .join("\n");

    const message = encodeURIComponent(
      `Olá, gostaria de fazer o pedido:\n\n${customerInfo}\n\n${itemsList}${shippingInfo}\n\n*Total: R$ ${formatBRL(finalTotal)}*`
    );

    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/sacola" className="rounded-full p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-medium">Suas Informações</span>
        </div>
      </header>

      <main className="flex-1 container max-w-2xl py-6">
        <div className="space-y-6">
          {/* Resumo do pedido */}
          <div className="rounded-lg border p-4 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Resumo do Pedido
            </h2>
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between text-sm">
                <span className="flex-1 min-w-0 truncate">
                  {item.quantity}x {item.product.name}
                </span>
                <span className="font-medium ml-3 shrink-0">
                  R$ {formatBRL(Number(item.product.price) * item.quantity)}
                </span>
              </div>
            ))}

            {shippingEnabled && shippingFee > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Frete</span>
                <span className="font-medium">R$ {formatBRL(shippingFee)}</span>
              </div>
            )}

            <div className="border-t pt-2 flex items-center justify-between font-bold">
              <span>Total</span>
              <span>R$ {formatBRL(finalTotal)}</span>
            </div>
          </div>

          {/* Aviso pedido mínimo */}
          {belowMinimum && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p>
                O pedido mínimo é de <strong>R$ {formatBRL(minimumOrderValue)}</strong>. 
                Adicione mais itens para continuar.
              </p>
            </div>
          )}

          {/* Dados do cliente */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Suas Informações
            </h2>

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input id="name" placeholder="Seu nome completo" value={data.name} onChange={(e) => update("name", e.target.value)} maxLength={100} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp *</Label>
              <Input id="phone" placeholder="(00) 00000-0000" value={data.phone} onChange={(e) => update("phone", formatPhone(e.target.value))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
              <Input id="cpfCnpj" placeholder="000.000.000-00 ou 00.000.000/0000-00" value={data.cpfCnpj} onChange={(e) => update("cpfCnpj", formatCpfCnpj(e.target.value))} />
            </div>

            {paymentEnabled && activeConditions.length > 0 && (
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {activeConditions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedPayment(c.name)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        selectedPayment === c.name
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" placeholder="Alguma observação sobre o pedido?" value={data.notes} onChange={(e) => update("notes", e.target.value)} maxLength={500} rows={3} />
            </div>
          </div>

          <button
            disabled={!isValid}
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3 font-semibold text-whatsapp-foreground transition-colors hover:bg-whatsapp-hover shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            <MessageCircle className="h-5 w-5" />
            Enviar Pedido
          </button>
        </div>
      </main>

      <CatalogFooter storeName={settings.store_name} footerColor={settings.footer_color} />
    </div>
  );
}
