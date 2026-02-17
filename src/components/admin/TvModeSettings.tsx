import { useState, useEffect } from "react";
import { Monitor, Copy, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { TvProductSelector } from "./TvProductSelector";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";
import type { Banner } from "@/hooks/useBanners";

interface TvModeSettingsProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<{ error: any }>;
  products: DbProduct[];
  categories: DbCategory[];
  banners: Banner[];
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

const SIZE_OPTIONS = [
  { value: "small", label: "Pequeno", desc: "Imagem menor, mais texto" },
  { value: "medium", label: "Médio", desc: "Balanceado (padrão)" },
  { value: "large", label: "Grande", desc: "Imagem maior, destaque visual" },
];

export function TvModeSettings({ settings, onUpdate, products, categories, banners }: TvModeSettingsProps) {
  const [bgColor, setBgColor] = useState(settings.tv_bg_color ?? "#000000");
  const [textColor, setTextColor] = useState(settings.tv_text_color ?? "#ffffff");
  const [priceColor, setPriceColor] = useState(settings.tv_price_color ?? "#22c55e");
  const [navBarColor, setNavBarColor] = useState(settings.tv_navbar_color ?? "#111111");
  const [navBarTextColor, setNavBarTextColor] = useState(settings.tv_navbar_text_color ?? "#ffffff");
  const [showLogo, setShowLogo] = useState(settings.tv_show_logo !== "false");
  const [showCode, setShowCode] = useState(settings.tv_show_code !== "false");
  const [showBrand, setShowBrand] = useState(settings.tv_show_brand !== "false");
  const [showProgress, setShowProgress] = useState(settings.tv_show_progress !== "false");
  const [showCounter, setShowCounter] = useState(settings.tv_show_counter !== "false");
  const [showDiscount, setShowDiscount] = useState(settings.tv_show_discount !== "false");
  const [showNavBar, setShowNavBar] = useState(settings.tv_show_navbar !== "false");
  const [showBanners, setShowBanners] = useState(settings.tv_show_banners !== "false");
  const [productSource, setProductSource] = useState(settings.tv_product_source ?? "latest");
  const [productSize, setProductSize] = useState(settings.tv_product_size ?? "medium");
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    try { return JSON.parse(settings.tv_product_ids || "[]"); } catch { return []; }
  });
  const [interval, setInterval_] = useState(settings.tv_mode_interval ?? "5");
  const [bannerInterval, setBannerInterval] = useState(settings.tv_banner_interval ?? "5");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBgColor(settings.tv_bg_color ?? "#000000");
    setTextColor(settings.tv_text_color ?? "#ffffff");
    setPriceColor(settings.tv_price_color ?? "#22c55e");
    setNavBarColor(settings.tv_navbar_color ?? "#111111");
    setNavBarTextColor(settings.tv_navbar_text_color ?? "#ffffff");
    setShowLogo(settings.tv_show_logo !== "false");
    setShowCode(settings.tv_show_code !== "false");
    setShowBrand(settings.tv_show_brand !== "false");
    setShowProgress(settings.tv_show_progress !== "false");
    setShowCounter(settings.tv_show_counter !== "false");
    setShowDiscount(settings.tv_show_discount !== "false");
    setShowNavBar(settings.tv_show_navbar !== "false");
    setShowBanners(settings.tv_show_banners !== "false");
    setProductSource(settings.tv_product_source ?? "latest");
    setProductSize(settings.tv_product_size ?? "medium");
    try { setSelectedIds(JSON.parse(settings.tv_product_ids || "[]")); } catch { setSelectedIds([]); }
    setInterval_(settings.tv_mode_interval ?? "5");
    setBannerInterval(settings.tv_banner_interval ?? "5");
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      onUpdate("tv_bg_color", bgColor),
      onUpdate("tv_text_color", textColor),
      onUpdate("tv_price_color", priceColor),
      onUpdate("tv_navbar_color", navBarColor),
      onUpdate("tv_navbar_text_color", navBarTextColor),
      onUpdate("tv_show_logo", showLogo ? "true" : "false"),
      onUpdate("tv_show_code", showCode ? "true" : "false"),
      onUpdate("tv_show_brand", showBrand ? "true" : "false"),
      onUpdate("tv_show_progress", showProgress ? "true" : "false"),
      onUpdate("tv_show_counter", showCounter ? "true" : "false"),
      onUpdate("tv_show_discount", showDiscount ? "true" : "false"),
      onUpdate("tv_show_navbar", showNavBar ? "true" : "false"),
      onUpdate("tv_show_banners", showBanners ? "true" : "false"),
      onUpdate("tv_product_source", productSource),
      onUpdate("tv_product_size", productSize),
      onUpdate("tv_product_ids", JSON.stringify(selectedIds)),
      onUpdate("tv_mode_interval", interval),
      onUpdate("tv_banner_interval", bannerInterval),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tvUrl = `${window.location.origin}/tv`;
  const handleCopy = () => {
    navigator.clipboard.writeText(tvUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeBanners = banners.filter((b) => b.active);

  return (
    <div className="space-y-6">
      {/* Link */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          Link do Modo TV
        </h3>
        <div className="flex items-center gap-2">
          <input readOnly value={tvUrl} className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none" />
          <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">Abra esse link em uma TV ou monitor para exibir os produtos.</p>
      </div>

      {/* Banners */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">🖼️ Banners no Modo TV</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exibe os banners ativos do catálogo entre os produtos na rotação.
            </p>
          </div>
          <Switch checked={showBanners} onCheckedChange={setShowBanners} />
        </div>
        {showBanners && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Segundos de exibição do banner</label>
              <input
                type="number"
                min="2"
                max="30"
                value={bannerInterval}
                onChange={(e) => setBannerInterval(e.target.value)}
                className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {activeBanners.length === 0
                ? "⚠️ Nenhum banner ativo. Adicione banners na aba Catálogo."
                : `${activeBanners.length} banner(s) ativo(s) serão exibidos na rotação.`}
            </p>
          </div>
        )}
      </div>

      {/* Fonte de produtos */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Produtos exibidos</h3>
        <p className="text-xs text-muted-foreground">Escolha quais produtos serão exibidos no Modo TV.</p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setProductSource("latest")}
            className={`rounded-lg border-2 p-3 text-left transition ${productSource === "latest" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
          >
            <p className="text-sm font-semibold">🆕 Últimos</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Cadastrados recentemente</p>
          </button>
          <button
            onClick={() => setProductSource("featured")}
            className={`rounded-lg border-2 p-3 text-left transition ${productSource === "featured" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
          >
            <p className="text-sm font-semibold">⭐ Destaques</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Marcados como destaque</p>
          </button>
          <button
            onClick={() => setProductSource("manual")}
            className={`rounded-lg border-2 p-3 text-left transition ${productSource === "manual" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
          >
            <p className="text-sm font-semibold">🎯 Manual</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Selecione individualmente</p>
          </button>
        </div>

        {productSource === "manual" && (
          <div className="pt-2 border-t">
            <TvProductSelector
              products={products}
              categories={categories}
              selectedIds={selectedIds}
              onChangeIds={setSelectedIds}
            />
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Tamanho da exibição</h3>
        <p className="text-xs text-muted-foreground">Controle o tamanho da imagem e informações do produto na tela.</p>
        <div className="grid grid-cols-3 gap-3">
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setProductSize(opt.value)}
              className={`rounded-lg border-2 p-3 text-center transition ${productSize === opt.value ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
            >
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cores da Navbar */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm">Barra de navegação</h3>
        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Cor de fundo da navbar" value={navBarColor} onChange={setNavBarColor} />
          <ColorField label="Cor do texto da navbar" value={navBarTextColor} onChange={setNavBarTextColor} />
        </div>
      </div>

      {/* Cores gerais */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm">Cores do conteúdo</h3>
        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Cor de fundo" value={bgColor} onChange={setBgColor} />
          <ColorField label="Cor do texto" value={textColor} onChange={setTextColor} />
        </div>
        <ColorField label="Cor do preço" value={priceColor} onChange={setPriceColor} />
      </div>

      {/* Intervalo */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Intervalo de rotação</h3>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Segundos entre produtos</label>
          <input
            type="number"
            min="2"
            max="60"
            value={interval}
            onChange={(e) => setInterval_(e.target.value)}
            className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Visibilidade */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm">Elementos visíveis</h3>
        {[
          { label: "Barra de navegação", desc: "Barra superior com logo e nome da loja", checked: showNavBar, set: setShowNavBar },
          { label: "Logo da empresa", desc: "Logo no canto superior (quando navbar desligada)", checked: showLogo, set: setShowLogo },
          { label: "Código do produto", desc: "Exibe o código abaixo do nome", checked: showCode, set: setShowCode },
          { label: "Marca", desc: "Exibe a marca do produto", checked: showBrand, set: setShowBrand },
          { label: "Preço original (riscado)", desc: "Exibe o desconto quando houver", checked: showDiscount, set: setShowDiscount },
          { label: "Barra de progresso", desc: "Barra inferior indicando posição", checked: showProgress, set: setShowProgress },
          { label: "Contador", desc: "Ex: 1 / 5 no canto inferior", checked: showCounter, set: setShowCounter },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch checked={item.checked} onCheckedChange={item.set} />
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Preview</h3>
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: bgColor }}>
          {showNavBar && (
            <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: navBarColor }}>
              <div className="w-6 h-6 rounded-full bg-white/20" />
              <p className="text-[10px] font-bold uppercase" style={{ color: navBarTextColor }}>Nome da Loja</p>
              <p className="text-[8px] tracking-widest uppercase" style={{ color: navBarTextColor, opacity: 0.5 }}>Subtítulo</p>
            </div>
          )}
          <div className="p-6 flex items-center justify-center gap-6 min-h-[100px]">
            <div className="w-16 h-16 rounded bg-white/10 flex items-center justify-center">
              <Monitor className="h-8 w-8" style={{ color: textColor, opacity: 0.4 }} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold uppercase" style={{ color: textColor }}>Nome do Produto</p>
              {showCode && <p className="text-[10px]" style={{ color: textColor, opacity: 0.5 }}>Cód: 12345</p>}
              {showDiscount && <p className="text-xs line-through" style={{ color: textColor, opacity: 0.4 }}>R$ 99,90</p>}
              <p className="text-lg font-extrabold" style={{ color: priceColor }}>R$ 49,90</p>
              {showBrand && <p className="text-[10px]" style={{ color: textColor, opacity: 0.6 }}>Marca Exemplo</p>}
            </div>
          </div>
          {showProgress && (
            <div className="h-1" style={{ backgroundColor: `${textColor}15` }}>
              <div className="h-full w-1/3" style={{ backgroundColor: `${textColor}99` }} />
            </div>
          )}
        </div>
      </div>

      {/* Salvar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
      >
        {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Configurações do Modo TV"}
      </button>
    </div>
  );
}
