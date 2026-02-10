import { useState, useEffect } from "react";
import { Settings } from "lucide-react";

interface SettingsPanelProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<{ error: any }>;
}

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp_number ?? "");
  const [storeName, setStoreName] = useState(settings.store_name ?? "");
  const [subtitle, setSubtitle] = useState(settings.store_subtitle ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setWhatsapp(settings.whatsapp_number ?? "");
    setStoreName(settings.store_name ?? "");
    setSubtitle(settings.store_subtitle ?? "");
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      onUpdate("whatsapp_number", whatsapp),
      onUpdate("store_name", storeName),
      onUpdate("store_subtitle", subtitle),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Configurações da Loja
      </h2>

      <input
        placeholder="Nome da empresa"
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        placeholder="Subtítulo (ex: Distribuidora)"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        placeholder="Número do WhatsApp (ex: 5511999999999)"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

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
