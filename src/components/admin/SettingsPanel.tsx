import { useState, useEffect, useRef } from "react";
import { Settings, Upload, Image, Store, Palette, Building2, Truck, ShoppingCart, Share2 } from "lucide-react";
import { storageApi } from "@/lib/api-client";
import { PaymentConditionsManager } from "./PaymentConditionsManager";
import { BannerManager } from "./BannerManager";
import { Switch } from "@/components/ui/switch";

interface SettingsPanelProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<{ error: any }>;
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <h3 className="font-semibold text-sm flex items-center gap-2 pt-2">
      <Icon className="h-4 w-4" />
      {title}
    </h3>
  );
}

function FieldInput({ label, placeholder, value, onChange, type = "text" }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border p-0.5" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>
    </div>
  );
}

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp_number ?? "");
  const [storeName, setStoreName] = useState(settings.store_name ?? "");
  const [subtitle, setSubtitle] = useState(settings.store_subtitle ?? "");
  const [logoUrl, setLogoUrl] = useState(settings.logo_url ?? "");
  const [welcomeText, setWelcomeText] = useState(settings.welcome_text ?? "");
  const [welcomeSubtext, setWelcomeSubtext] = useState(settings.welcome_subtext ?? "");
  const [headerColor, setHeaderColor] = useState(settings.header_color ?? "#1f1f1f");
  const [footerColor, setFooterColor] = useState(settings.footer_color ?? "#1f1f1f");
  const [buttonColor, setButtonColor] = useState(settings.button_color ?? "#1f1f1f");
  const [textColor, setTextColor] = useState(settings.text_color ?? "#1f1f1f");
  const [priceColor, setPriceColor] = useState(settings.price_color ?? "#1f1f1f");
  const [companyPhone, setCompanyPhone] = useState(settings.company_phone ?? "");
  const [companyEmail, setCompanyEmail] = useState(settings.company_email ?? "");
  const [companyAddress, setCompanyAddress] = useState(settings.company_address ?? "");
  const [companyHours, setCompanyHours] = useState(settings.company_hours ?? "");
  const [companyDescription, setCompanyDescription] = useState(settings.company_description ?? "");
  const [shippingFee, setShippingFee] = useState(settings.shipping_fee ?? "0");
  const [minimumOrderValue, setMinimumOrderValue] = useState(settings.minimum_order_value ?? "0");
  const [socialInstagram, setSocialInstagram] = useState(settings.social_instagram ?? "");
  const [socialFacebook, setSocialFacebook] = useState(settings.social_facebook ?? "");
  const [socialTiktok, setSocialTiktok] = useState(settings.social_tiktok ?? "");
  const [socialYoutube, setSocialYoutube] = useState(settings.social_youtube ?? "");
  const [socialWebsite, setSocialWebsite] = useState(settings.social_website ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const shippingEnabled = settings.shipping_enabled === "true";
  const minimumOrderEnabled = settings.minimum_order_enabled === "true";
  const hideNoPhoto = settings.hide_products_without_photo === "true";

  useEffect(() => {
    setWhatsapp(settings.whatsapp_number ?? "");
    setStoreName(settings.store_name ?? "");
    setSubtitle(settings.store_subtitle ?? "");
    setLogoUrl(settings.logo_url ?? "");
    setWelcomeText(settings.welcome_text ?? "");
    setWelcomeSubtext(settings.welcome_subtext ?? "");
    setHeaderColor(settings.header_color ?? "#1f1f1f");
    setFooterColor(settings.footer_color ?? "#1f1f1f");
    setButtonColor(settings.button_color ?? "#1f1f1f");
    setTextColor(settings.text_color ?? "#1f1f1f");
    setPriceColor(settings.price_color ?? "#1f1f1f");
    setCompanyPhone(settings.company_phone ?? "");
    setCompanyEmail(settings.company_email ?? "");
    setCompanyAddress(settings.company_address ?? "");
    setCompanyHours(settings.company_hours ?? "");
    setCompanyDescription(settings.company_description ?? "");
    setShippingFee(settings.shipping_fee ?? "0");
    setMinimumOrderValue(settings.minimum_order_value ?? "0");
    setSocialInstagram(settings.social_instagram ?? "");
    setSocialFacebook(settings.social_facebook ?? "");
    setSocialTiktok(settings.social_tiktok ?? "");
    setSocialYoutube(settings.social_youtube ?? "");
    setSocialWebsite(settings.social_website ?? "");
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url } = await storageApi.uploadFile(file);
    if (url) setLogoUrl(url);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      onUpdate("whatsapp_number", whatsapp),
      onUpdate("store_name", storeName),
      onUpdate("store_subtitle", subtitle),
      onUpdate("logo_url", logoUrl),
      onUpdate("welcome_text", welcomeText),
      onUpdate("welcome_subtext", welcomeSubtext),
      onUpdate("header_color", headerColor),
      onUpdate("footer_color", footerColor),
      onUpdate("button_color", buttonColor),
      onUpdate("text_color", textColor),
      onUpdate("price_color", priceColor),
      onUpdate("company_phone", companyPhone),
      onUpdate("company_email", companyEmail),
      onUpdate("company_address", companyAddress),
      onUpdate("company_hours", companyHours),
      onUpdate("company_description", companyDescription),
      onUpdate("shipping_fee", shippingFee),
      onUpdate("minimum_order_value", minimumOrderValue),
      onUpdate("social_instagram", socialInstagram),
      onUpdate("social_facebook", socialFacebook),
      onUpdate("social_tiktok", socialTiktok),
      onUpdate("social_youtube", socialYoutube),
      onUpdate("social_website", socialWebsite),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ─── Loja ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <SectionHeader icon={Store} title="Loja" />

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Logo da empresa</label>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-14 w-auto rounded border object-contain bg-white p-1" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded border bg-muted">
                <Image className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition">
              <Upload className="h-4 w-4" />
              {uploading ? "Enviando..." : "Enviar Logo"}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>

        <FieldInput label="Nome da empresa" placeholder="Nome da empresa" value={storeName} onChange={setStoreName} />
        <FieldInput label="Subtítulo" placeholder="Subtítulo (ex: Distribuidora)" value={subtitle} onChange={setSubtitle} />
        <FieldInput label="Texto de boas-vindas" placeholder="❤️ Bem-vindo ao nosso catálogo digital! ❤️" value={welcomeText} onChange={setWelcomeText} />
        <FieldInput label="Subtexto de boas-vindas" placeholder="Escolha seus produtos e faça seu pedido..." value={welcomeSubtext} onChange={setWelcomeSubtext} />
        <FieldInput label="Número do WhatsApp" placeholder="5511999999999" value={whatsapp} onChange={setWhatsapp} />
      </div>

      {/* ─── Aparência ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <SectionHeader icon={Palette} title="Aparência" />
        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Cor do Cabeçalho" value={headerColor} onChange={setHeaderColor} />
          <ColorField label="Cor do Rodapé" value={footerColor} onChange={setFooterColor} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <ColorField label="Botão Comprar" value={buttonColor} onChange={setButtonColor} />
          <ColorField label="Cor das Letras" value={textColor} onChange={setTextColor} />
          <ColorField label="Cor dos Preços" value={priceColor} onChange={setPriceColor} />
        </div>
      </div>

      {/* ─── Banners ─── */}
      <BannerManager />

      {/* ─── Informações da Empresa ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <SectionHeader icon={Building2} title="Informações da Empresa (Menu ☰)" />

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Descrição da empresa</label>
          <textarea
            placeholder="Somos distribuidores de acessórios..."
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FieldInput label="Telefone" placeholder="(11) 99999-9999" value={companyPhone} onChange={setCompanyPhone} />
          <FieldInput label="E-mail" placeholder="contato@empresa.com" value={companyEmail} onChange={setCompanyEmail} />
        </div>
        <FieldInput label="Endereço" placeholder="Rua Exemplo, 123 - Cidade/UF" value={companyAddress} onChange={setCompanyAddress} />
        <FieldInput label="Horário de funcionamento" placeholder="Seg a Sex: 8h às 18h" value={companyHours} onChange={setCompanyHours} />
      </div>

      {/* ─── Redes Sociais ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <SectionHeader icon={Share2} title="Redes Sociais" />
        <FieldInput label="Instagram" placeholder="https://instagram.com/suaempresa" value={socialInstagram} onChange={setSocialInstagram} />
        <FieldInput label="Facebook" placeholder="https://facebook.com/suaempresa" value={socialFacebook} onChange={setSocialFacebook} />
        <FieldInput label="TikTok" placeholder="https://tiktok.com/@suaempresa" value={socialTiktok} onChange={setSocialTiktok} />
        <FieldInput label="YouTube" placeholder="https://youtube.com/@suaempresa" value={socialYoutube} onChange={setSocialYoutube} />
        <FieldInput label="Site / Loja" placeholder="https://suaempresa.com.br" value={socialWebsite} onChange={setSocialWebsite} />
      </div>

      {/* ─── Catálogo ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <SectionHeader icon={Image} title="Catálogo" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Ocultar produtos sem foto</p>
            <p className="text-xs text-muted-foreground">Produtos sem imagem não aparecem no catálogo público</p>
          </div>
          <Switch checked={hideNoPhoto} onCheckedChange={(val) => onUpdate("hide_products_without_photo", val ? "true" : "false")} />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <SectionHeader icon={Truck} title="Frete" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Ativar taxa de frete</p>
            <p className="text-xs text-muted-foreground">Adiciona o valor do frete ao total do pedido</p>
          </div>
          <Switch checked={shippingEnabled} onCheckedChange={(val) => onUpdate("shipping_enabled", val ? "true" : "false")} />
        </div>
        {shippingEnabled && (
          <FieldInput
            label="Valor do frete (R$)"
            placeholder="15.00"
            value={shippingFee}
            onChange={setShippingFee}
          />
        )}
      </div>

      {/* ─── Pedido Mínimo ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <SectionHeader icon={ShoppingCart} title="Pedido Mínimo" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Ativar pedido mínimo</p>
            <p className="text-xs text-muted-foreground">Bloqueia o envio se o total for inferior ao valor mínimo</p>
          </div>
          <Switch checked={minimumOrderEnabled} onCheckedChange={(val) => onUpdate("minimum_order_enabled", val ? "true" : "false")} />
        </div>
        {minimumOrderEnabled && (
          <FieldInput
            label="Valor mínimo (R$)"
            placeholder="50.00"
            value={minimumOrderValue}
            onChange={setMinimumOrderValue}
          />
        )}
      </div>

      {/* ─── Condições de Pagamento ─── */}
      <PaymentConditionsManager
        enabled={settings.payment_conditions_enabled === "true"}
        onToggle={(val) => onUpdate("payment_conditions_enabled", val ? "true" : "false")}
      />

      {/* ─── Botão Salvar ─── */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
      >
        {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Configurações"}
      </button>
    </div>
  );
}
