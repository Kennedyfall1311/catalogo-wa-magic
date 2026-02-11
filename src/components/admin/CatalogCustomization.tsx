import { useState, useEffect } from "react";
import { LayoutGrid, Eye, EyeOff, ShoppingBag, Palette, Star, Shuffle, List, Tag } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { FeaturedProductsManager } from "./FeaturedProductsManager";
import { QuickFilterProductSelector } from "./QuickFilterProductSelector";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";

interface Props {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<{ error: any }>;
  products?: DbProduct[];
  categories?: DbCategory[];
  onUpdateProduct?: (id: string, data: Partial<DbProduct>) => Promise<any>;
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

export function CatalogCustomization({ settings, onUpdate, products, categories, onUpdateProduct }: Props) {
  const displayMode = settings.catalog_first_page_mode || "default";
  const [buttonColor, setButtonColor] = useState(settings.button_color ?? "#1f1f1f");
  const [textColor, setTextColor] = useState(settings.text_color ?? "#1f1f1f");
  const [priceColor, setPriceColor] = useState(settings.price_color ?? "#1f1f1f");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hideNoPhoto = settings.hide_products_without_photo === "true";

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

      {/* ─── Botões Rápidos da Barra ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Botões Rápidos do Catálogo
        </h3>
        <p className="text-xs text-muted-foreground">
          Configure os botões de filtro rápido que aparecem ao lado da barra de busca
        </p>

        {[
          { key: "promo", labelKey: "quick_filter_promo_label", defaultLabel: "Promoção", bgKey: "quick_filter_promo_bg", textKey: "quick_filter_promo_text", visibleKey: "quick_filter_promo_visible", filterTypeKey: "quick_filter_promo_type", productField: null as string | null },
          { key: "custom1", labelKey: "quick_filter_custom1_label", defaultLabel: "Destaque", bgKey: "quick_filter_custom1_bg", textKey: "quick_filter_custom1_text", visibleKey: "quick_filter_custom1_visible", filterTypeKey: "quick_filter_custom1_type", productField: "quick_filter_1" as string | null },
          { key: "custom2", labelKey: "quick_filter_custom2_label", defaultLabel: "Novidades", bgKey: "quick_filter_custom2_bg", textKey: "quick_filter_custom2_text", visibleKey: "quick_filter_custom2_visible", filterTypeKey: "quick_filter_custom2_type", productField: "quick_filter_2" as string | null },
        ].map((btn) => {
          const isVisible = settings[btn.visibleKey] === "true";
          const label = settings[btn.labelKey] || btn.defaultLabel;
          const bg = settings[btn.bgKey] || "#1f1f1f";
          const text = settings[btn.textKey] || "#ffffff";
          const filterType = btn.key === "promo" ? "promotion" : (settings[btn.filterTypeKey] || "manual");
          return (
            <div key={btn.key} className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded px-2 py-1 text-xs font-bold"
                    style={{ backgroundColor: bg, color: text }}
                  >
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {filterType === "promotion" && "(Filtra promoções)"}
                    {filterType === "category" && "(Filtra por categoria)"}
                    {filterType === "manual" && "(Seleção manual)"}
                  </span>
                </div>
                <Switch
                  checked={isVisible}
                  onCheckedChange={(val) => onUpdate(btn.visibleKey, val ? "true" : "false")}
                />
              </div>
              {isVisible && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Nome</label>
                      <input
                        value={label}
                        onChange={(e) => onUpdate(btn.labelKey, e.target.value)}
                        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Cor do Fundo</label>
                      <div className="flex items-center gap-1">
                        <input type="color" value={bg} onChange={(e) => onUpdate(btn.bgKey, e.target.value)} className="h-9 w-10 cursor-pointer rounded border p-0.5" />
                        <input value={bg} onChange={(e) => onUpdate(btn.bgKey, e.target.value)} className="flex-1 rounded-lg border bg-muted/50 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Cor do Texto</label>
                      <div className="flex items-center gap-1">
                        <input type="color" value={text} onChange={(e) => onUpdate(btn.textKey, e.target.value)} className="h-9 w-10 cursor-pointer rounded border p-0.5" />
                        <input value={text} onChange={(e) => onUpdate(btn.textKey, e.target.value)} className="flex-1 rounded-lg border bg-muted/50 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                    </div>
                  </div>

                  {/* Filter type selector (not for promo which is always "promotion") */}
                  {btn.key !== "promo" && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Tipo de Filtro</label>
                      <select
                        value={filterType}
                        onChange={(e) => onUpdate(btn.filterTypeKey, e.target.value)}
                        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="manual">Seleção manual de produtos</option>
                        <option value="category">Filtrar por categoria</option>
                        <option value="promotion">Promoções (com desconto)</option>
                      </select>
                    </div>
                  )}

                  {/* Category selector */}
                  {btn.key !== "promo" && filterType === "category" && categories && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                      <select
                        value={settings[`${btn.filterTypeKey}_category`] || ""}
                        onChange={(e) => onUpdate(`${btn.filterTypeKey}_category`, e.target.value)}
                        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Manual product selector */}
                  {btn.key !== "promo" && filterType === "manual" && products && categories && onUpdateProduct && btn.productField && (
                    <QuickFilterProductSelector
                      products={products}
                      categories={categories}
                      fieldName={btn.productField}
                      onUpdateProduct={onUpdateProduct}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Preview do Card ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          Preview do Card
        </h3>
        <p className="text-xs text-muted-foreground">Veja como o card do produto aparece no catálogo</p>

        <div className="flex justify-center">
          <div className="w-48 border rounded-lg overflow-hidden bg-background shadow-sm transition-all">
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
                className="text-[11px] font-semibold uppercase leading-tight line-clamp-2"
                style={{ color: textColor }}
              >
                PRODUTO EXEMPLO
              </h3>
              <p className="text-[10px] text-muted-foreground">Cód: 12345</p>
              <p className="text-[10px] text-muted-foreground line-through">
                de R$ 99,90
              </p>
              <p className="text-sm font-bold" style={{ color: priceColor }}>
                R$ 79,90
              </p>

              {CATALOG_FIELDS.map((field) =>
                settings[field.key] === "true" ? (
                  <p key={field.key} className="text-[10px] text-muted-foreground">
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

      {/* ─── Amostragem da Primeira Página ─── */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 pt-2">
          <Star className="h-4 w-4" />
          Amostragem da Primeira Página
        </h3>
        <p className="text-xs text-muted-foreground">
          Configure como os primeiros 40 produtos aparecem ao abrir o catálogo. Depois que o cliente carregar mais, a ordem segue normalmente.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "default", label: "Padrão", icon: List, desc: "Ordem de cadastro" },
            { value: "random", label: "Aleatório", icon: Shuffle, desc: "Ordem embaralhada" },
            { value: "featured", label: "Destaques", icon: Star, desc: "Produtos selecionados" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate("catalog_first_page_mode", opt.value)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition ${
                displayMode === opt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <opt.icon className={`h-5 w-5 ${displayMode === opt.value ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs font-semibold">{opt.label}</span>
              <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
            </button>
          ))}
        </div>

        {displayMode === "featured" && products && categories && onUpdateProduct && (
          <FeaturedProductsManager
            products={products}
            categories={categories}
            onUpdateProduct={onUpdateProduct}
          />
        )}
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
