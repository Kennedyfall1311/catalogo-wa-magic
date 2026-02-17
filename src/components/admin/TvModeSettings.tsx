import { useState, useEffect } from "react";
import { Monitor, Copy, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface TvModeSettingsProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<{ error: any }>;
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

export function TvModeSettings({ settings, onUpdate }: TvModeSettingsProps) {
  const [bgColor, setBgColor] = useState(settings.tv_bg_color ?? "#000000");
  const [textColor, setTextColor] = useState(settings.tv_text_color ?? "#ffffff");
  const [priceColor, setPriceColor] = useState(settings.tv_price_color ?? "#22c55e");
  const [showLogo, setShowLogo] = useState(settings.tv_show_logo !== "false");
  const [showCode, setShowCode] = useState(settings.tv_show_code !== "false");
  const [showBrand, setShowBrand] = useState(settings.tv_show_brand !== "false");
  const [showProgress, setShowProgress] = useState(settings.tv_show_progress !== "false");
  const [showCounter, setShowCounter] = useState(settings.tv_show_counter !== "false");
  const [showDiscount, setShowDiscount] = useState(settings.tv_show_discount !== "false");
  const [interval, setInterval_] = useState(settings.tv_mode_interval ?? "5");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBgColor(settings.tv_bg_color ?? "#000000");
    setTextColor(settings.tv_text_color ?? "#ffffff");
    setPriceColor(settings.tv_price_color ?? "#22c55e");
    setShowLogo(settings.tv_show_logo !== "false");
    setShowCode(settings.tv_show_code !== "false");
    setShowBrand(settings.tv_show_brand !== "false");
    setShowProgress(settings.tv_show_progress !== "false");
    setShowCounter(settings.tv_show_counter !== "false");
    setShowDiscount(settings.tv_show_discount !== "false");
    setInterval_(settings.tv_mode_interval ?? "5");
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      onUpdate("tv_bg_color", bgColor),
      onUpdate("tv_text_color", textColor),
      onUpdate("tv_price_color", priceColor),
      onUpdate("tv_show_logo", showLogo ? "true" : "false"),
      onUpdate("tv_show_code", showCode ? "true" : "false"),
      onUpdate("tv_show_brand", showBrand ? "true" : "false"),
      onUpdate("tv_show_progress", showProgress ? "true" : "false"),
      onUpdate("tv_show_counter", showCounter ? "true" : "false"),
      onUpdate("tv_show_discount", showDiscount ? "true" : "false"),
      onUpdate("tv_mode_interval", interval),
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
        <p className="text-[11px] text-muted-foreground">Abra esse link em uma TV ou monitor para exibir os produtos em destaque.</p>
      </div>

      {/* Cores */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm">Cores</h3>
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
          { label: "Logo da empresa", desc: "Exibe a logo no canto superior", checked: showLogo, set: setShowLogo },
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

      {/* Preview miniatura */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Preview</h3>
        <div
          className="rounded-lg p-6 flex items-center justify-center gap-6 min-h-[120px]"
          style={{ backgroundColor: bgColor }}
        >
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
