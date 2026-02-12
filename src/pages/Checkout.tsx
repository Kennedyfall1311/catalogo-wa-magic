import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { ordersApi } from "@/lib/api-client";
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
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
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
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState("");

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
          <div className="container flex h-14 items-center gap-3">
            <Link to="/" className="rounded-full p-2 hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-sm font-medium">Pedido Enviado</span>
          </div>
        </header>
        <main className="flex-1 container max-w-md py-16 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold">Pedido enviado com sucesso! 🎉</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Uma janela do WhatsApp foi aberta com o resumo do seu pedido.
            <br /><br />
            <strong>Importante:</strong> Envie a mensagem no WhatsApp para que o vendedor receba seu pedido. 
            Sem o envio da mensagem, o vendedor não receberá o pedido.
          </p>
          <div className="space-y-3 pt-2">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-semibold text-whatsapp-foreground hover:bg-whatsapp-hover transition"
              >
                <MessageCircle className="h-5 w-5" />
                Reenviar Pedido pelo WhatsApp
              </a>
            )}
            <button
              onClick={() => navigate("/")}
              className="w-full rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted transition"
            >
              Voltar ao Catálogo
            </button>
          </div>
        </main>
        <CatalogFooter storeName={settings.store_name} footerColor={settings.footer_color} />
      </div>
    );
  }

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

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const idempotencyKey = crypto.randomUUID();

    // Save order to database
    const order = {
      customer_name: data.name,
      customer_phone: data.phone,
      customer_cpf_cnpj: data.cpfCnpj || null,
      payment_method: selectedPayment || null,
      notes: data.notes || null,
      subtotal: totalPrice,
      shipping_fee: shippingFee,
      total: finalTotal,
      status: "pending",
    };
    const orderItems = items.map((i) => ({
      product_id: i.product.id,
      product_name: i.product.name,
      product_code: i.product.code || null,
      quantity: i.quantity,
      unit_price: Number(i.product.price),
      total_price: Number(i.product.price) * i.quantity,
    }));

    const { error } = await ordersApi.create(order, orderItems, idempotencyKey);
    if (error) {
      setSubmitting(false);
      setSubmitError("Não foi possível enviar o pedido. Verifique sua conexão e tente novamente.");
      return;
    }

    // Build formatted WhatsApp message
    const storeName = settings.store_name || "Catálogo";
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const line = "----------------------";

    const itemLines = items.map((i, idx) => {
      const subtotal = Number(i.product.price) * i.quantity;
      const code = i.product.code || "N/A";
      return `${idx + 1}. *${i.product.name}*\n   Cod: ${code} | Qtd: ${i.quantity}\n   Valor: R$ ${formatBRL(subtotal)}`;
    }).join("\n\n");

    let totalsSection = `Subtotal: R$ ${formatBRL(totalPrice)}`;
    if (shippingEnabled && shippingFee > 0) {
      totalsSection += `\nFrete: R$ ${formatBRL(shippingFee)}`;
    }
    totalsSection += `\n*TOTAL: R$ ${formatBRL(finalTotal)}*`;

    const paymentLine = selectedPayment ? `\nPagamento: ${selectedPayment}` : "";
    const notesLine = data.notes ? `\nObs: ${data.notes}` : "";

    const msg = [
      `*PEDIDO - ${storeName}*`,
      `Data: ${dateStr} as ${timeStr}`,
      line,
      `Cliente: ${data.name}`,
      `Telefone: ${data.phone}`,
      data.cpfCnpj ? `CPF/CNPJ: ${data.cpfCnpj}` : "",
      line,
      `*ITENS DO PEDIDO:*`,
      "",
      itemLines,
      "",
      line,
      totalsSection,
      paymentLine,
      notesLine,
      line,
      `Pedido gerado pelo ${storeName}`,
    ].filter(Boolean).join("\n");

    const message = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank");

    setWhatsappLink(whatsappUrl);
    clearCart();
    setSubmitted(true);
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

          {submitError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p>{submitError}</p>
            </div>
          )}

          <button
            disabled={!isValid || submitting}
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3 font-semibold text-whatsapp-foreground transition-colors hover:bg-whatsapp-hover shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            <MessageCircle className="h-5 w-5" />
            {submitting ? "Enviando..." : "Enviar Pedido"}
          </button>
        </div>
      </main>

      <CatalogFooter storeName={settings.store_name} footerColor={settings.footer_color} />
    </div>
  );
}
