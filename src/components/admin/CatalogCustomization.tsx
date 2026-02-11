import { useState, useEffect } from "react";
import { LayoutGrid, Eye, EyeOff, ShoppingBag, Palette, Maximize2, Type } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface Props {
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

const CATALOG_FIELDS = [
  { key: "catalog_show_description", label: "Descrição", sampleValue: "Torneira de mesa cromada com acabamento premium" },
  { key: "catalog_show_reference", label: "Referência", sampleValue: "REF-4521" },
  { key: "catalog_show_manufacturer_code", label: "Código do Fabricante", sampleValue: "FAB-0093" },
  { key: "catalog_show_unit_of_measure", label: "Unidade de Medida", sampleValue: "UN" },
  { key: "catalog_show_quantity", label: "Quantidade", sampleValue: "150" },
];

const CARD_SIZE_LABELS: Record<string, string> = { "1": "Pequeno", "2": "Médio", "3": "Grande" };
const FONT_SIZE_LABELS: Record<string, string> = { "1": "Pequeno", "2": "Médio", "3": "Grande" };

export function CatalogCustomization({ settings, onUpdate }: Props) {
  const [buttonColor, setButtonColor] = useState(settings.button_color ?? "#1f1f1f");
  const [textColor, setTextColor] = useState(settings.text_color ?? "#1f1f1f");
  const [priceColor, setPriceColor] = useState(settings.price_color ?? "#1f1f1f");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hideNoPhoto = settings.hide_products_without_photo === "true";
  const cardSize = settings.catalog_card_size ?? "1";
  const fontSize = settings.catalog_font_size ?? "1";

  // Preview scale mapping
  const previewWidth = cardSize === "3" ? "w-56" : cardSize === "2" ? "w-52" : "w-48";
  const previewNameSize = fontSize === "3" ? "text-sm" : fontSize === "2" ? "text-xs" : "text-[11px]";
  const previewPriceSize = fontSize === "3" ? "text-lg" : fontSize === "2" ? "text-base" : "text-sm";
  const previewDetailSize = fontSize === "3" ? "text-xs" : fontSize === "2" ? "text-[11px]" : "text-[10px]";

  useEffect(() => {
    setButtonColor(settings.button_color ?? "#1f1f1f");
    setTextColor(settings.text_color ?? "#1f1f1f");
    setPriceColor(settings.price_color ?? "#1f1f1f");
  }, [settings]);

  const handleSaveColors = async () => {
    setSaving(true);
    await Promise.all([
      onUpdate("button_color", buttonColor),
      onUpdate("text_color", textColor),
      onUpdate("price_color", priceColor),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ─── Preview do Card ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview do Card
        </h3>
        <p className="text-xs text-muted-foreground">Veja como o card do produto aparece no catálogo</p>

        <div className="flex justify-center">
          <div className={`${previewWidth} border rounded-lg overflow-hidden bg-background shadow-sm transition-all`}>
            <div className="relative aspect-square overflow-hidden bg-card p-2">
              <div className="h-full w-full bg-muted rounded flex items-center justify-center">
                <LayoutGrid className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <span className="absolute top-1 left-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                OFERTA
              </span>
            </div>

            <div className="px-2 py-3 text-center border-t space-y-1">
              <h3
                className={`${previewNameSize} font-semibold uppercase leading-tight line-clamp-2`}
                style={{ color: textColor }}
              >
                PRODUTO EXEMPLO
              </h3>
              <p className={`${previewDetailSize} text-muted-foreground`}>Cód: 12345</p>
              <p className={`${previewDetailSize} text-muted-foreground line-through`}>
                de R$ 99,90
              </p>
              <p className={`${previewPriceSize} font-bold`} style={{ color: priceColor }}>
                R$ 79,90
              </p>

              {CATALOG_FIELDS.map((field) =>
                settings[field.key] === "true" ? (
                  <p key={field.key} className={`${previewDetailSize} text-muted-foreground`}>
                    {field.key === "catalog_show_description"
                      ? field.sampleValue
                      : `${field.label}: ${field.sampleValue}`}
                  </p>
                ) : null
              )}

              <button
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: buttonColor }}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Comprar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tamanho do Card e Fonte ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 pt-2">
          <Maximize2 className="h-4 w-4" />
          Tamanho do Card
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Tamanho: {CARD_SIZE_LABELS[cardSize]}</label>
          </div>
          <Slider
            value={[Number(cardSize)]}
            min={1}
            max={3}
            step={1}
            onValueChange={([v]) => onUpdate("catalog_card_size", String(v))}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Pequeno</span><span>Médio</span><span>Grande</span>
          </div>
        </div>

        <h3 className="font-semibold text-sm flex items-center gap-2 pt-2">
          <Type className="h-4 w-4" />
          Tamanho da Fonte
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Tamanho: {FONT_SIZE_LABELS[fontSize]}</label>
          </div>
          <Slider
            value={[Number(fontSize)]}
            min={1}
            max={3}
            step={1}
            onValueChange={([v]) => onUpdate("catalog_font_size", String(v))}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Pequeno</span><span>Médio</span><span>Grande</span>
          </div>
        </div>
      </div>

      {/* ─── Cores do Card ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 pt-2">
          <Palette className="h-4 w-4" />
          Cores do Card
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <ColorField label="Botão Comprar" value={buttonColor} onChange={setButtonColor} />
          <ColorField label="Cor das Letras" value={textColor} onChange={setTextColor} />
          <ColorField label="Cor dos Preços" value={priceColor} onChange={setPriceColor} />
        </div>
        <button
          onClick={handleSaveColors}
          disabled={saving}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Cores"}
        </button>
      </div>

      {/* ─── Campos Visíveis ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 pt-2">
          <LayoutGrid className="h-4 w-4" />
          Campos Visíveis no Card
        </h3>
        <p className="text-xs text-muted-foreground">Ative os campos que deseja exibir no card do produto</p>

        {CATALOG_FIELDS.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <p className="text-sm">{item.label}</p>
            <Switch
              checked={settings[item.key] === "true"}
              onCheckedChange={(val) => onUpdate(item.key, val ? "true" : "false")}
            />
          </div>
        ))}
      </div>

      {/* ─── Filtros ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 pt-2">
          <EyeOff className="h-4 w-4" />
          Filtros do Catálogo
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Ocultar produtos sem foto</p>
            <p className="text-xs text-muted-foreground">Produtos sem imagem não aparecem no catálogo público</p>
          </div>
          <Switch checked={hideNoPhoto} onCheckedChange={(val) => onUpdate("hide_products_without_photo", val ? "true" : "false")} />
        </div>
      </div>
    </div>
  );
}
