import { useState, useEffect, useRef } from "react";
import { Settings, Upload, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SettingsPanelProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<{ error: any }>;
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    }
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
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Configurações da Loja
      </h2>

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

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Nome da empresa</label>
        <input
          placeholder="Nome da empresa"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Subtítulo</label>
        <input
          placeholder="Subtítulo (ex: Distribuidora)"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Texto de boas-vindas</label>
        <input
          placeholder="❤️ Bem-vindo ao nosso catálogo digital! ❤️"
          value={welcomeText}
          onChange={(e) => setWelcomeText(e.target.value)}
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Subtexto de boas-vindas</label>
        <input
          placeholder="Escolha seus produtos e faça seu pedido..."
          value={welcomeSubtext}
          onChange={(e) => setWelcomeSubtext(e.target.value)}
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Número do WhatsApp</label>
        <input
          placeholder="Número do WhatsApp (ex: 5511999999999)"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Cor do Cabeçalho</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={headerColor}
              onChange={(e) => setHeaderColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border p-0.5"
            />
            <input
              value={headerColor}
              onChange={(e) => setHeaderColor(e.target.value)}
              className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Cor do Rodapé</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={footerColor}
              onChange={(e) => setFooterColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border p-0.5"
            />
            <input
              value={footerColor}
              onChange={(e) => setFooterColor(e.target.value)}
              className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
      </div>
      </div>

      <hr className="border-border" />
      <h3 className="font-semibold text-sm flex items-center gap-2">
        📋 Informações da Empresa (Menu ☰)
      </h3>

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
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Telefone</label>
          <input
            placeholder="(11) 99999-9999"
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
            className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">E-mail</label>
          <input
            placeholder="contato@empresa.com"
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
            className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Endereço</label>
        <input
          placeholder="Rua Exemplo, 123 - Cidade/UF"
          value={companyAddress}
          onChange={(e) => setCompanyAddress(e.target.value)}
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Horário de funcionamento</label>
        <input
          placeholder="Seg a Sex: 8h às 18h"
          value={companyHours}
          onChange={(e) => setCompanyHours(e.target.value)}
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Cor do Botão Comprar</label>
          <div className="flex items-center gap-2">
            <input type="color" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border p-0.5" />
            <input value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Cor das Letras</label>
          <div className="flex items-center gap-2">
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border p-0.5" />
            <input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Cor dos Preços</label>
          <div className="flex items-center gap-2">
            <input type="color" value={priceColor} onChange={(e) => setPriceColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border p-0.5" />
            <input value={priceColor} onChange={(e) => setPriceColor(e.target.value)} className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
      >
        {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Configurações"}
      </button>
    </div>
  );
}
