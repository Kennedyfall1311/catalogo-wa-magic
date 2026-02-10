import { useState, useEffect } from "react";
import { Link2, RefreshCw, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface IntegrationPanelProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<{ error: any }>;
}

function FieldInput({ label, placeholder, value, onChange, type = "text", disabled = false }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

export function IntegrationPanel({ settings, onUpdate }: IntegrationPanelProps) {
  const [apiUrl, setApiUrl] = useState(settings.erp_api_url ?? "");
  const [apiToken, setApiToken] = useState(settings.erp_api_token ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const erpEnabled = settings.erp_enabled === "true";
  const syncProducts = settings.erp_sync_products !== "false";
  const syncStock = settings.erp_sync_stock !== "false";
  const sendOrders = settings.erp_send_orders !== "false";

  useEffect(() => {
    setApiUrl(settings.erp_api_url ?? "");
    setApiToken(settings.erp_api_token ?? "");
  }, [settings]);

  const isConfigured = apiUrl.trim().length > 0 && apiToken.trim().length > 0;

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      onUpdate("erp_api_url", apiUrl.trim()),
      onUpdate("erp_api_token", apiToken.trim()),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Integração ERP
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Ativar integração</p>
            <p className="text-xs text-muted-foreground">Habilita a comunicação com o ERP externo</p>
          </div>
          <Switch
            checked={erpEnabled}
            onCheckedChange={(val) => onUpdate("erp_enabled", val ? "true" : "false")}
          />
        </div>

        {erpEnabled && !isConfigured && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">
              Configure a URL e o token da API abaixo para começar a sincronizar.
            </p>
          </div>
        )}

        {erpEnabled && isConfigured && (
          <div className="flex items-start gap-2 rounded-lg bg-primary/10 border border-primary/20 p-3">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-primary">
              Integração configurada. Use o botão "Sincronizar Agora" quando sua API estiver pronta.
            </p>
          </div>
        )}
      </div>

      {/* Conexão */}
      {erpEnabled && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            🔗 Conexão com a API
          </h3>

          <FieldInput
            label="URL base da API"
            placeholder="https://api.meuerp.com/v1"
            value={apiUrl}
            onChange={setApiUrl}
          />

          <FieldInput
            label="Token de autenticação"
            placeholder="Bearer seu-token-aqui"
            value={apiToken}
            onChange={setApiToken}
            type="password"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Conexão"}
          </button>
        </div>
      )}

      {/* Módulos */}
      {erpEnabled && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Módulos de Sincronização
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Produtos e preços</p>
                <p className="text-xs text-muted-foreground">Importa produtos, nomes, preços e categorias do ERP</p>
              </div>
              <Switch
                checked={syncProducts}
                onCheckedChange={(val) => onUpdate("erp_sync_products", val ? "true" : "false")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Estoque</p>
                <p className="text-xs text-muted-foreground">Sincroniza quantidade disponível de cada produto</p>
              </div>
              <Switch
                checked={syncStock}
                onCheckedChange={(val) => onUpdate("erp_sync_stock", val ? "true" : "false")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enviar pedidos</p>
                <p className="text-xs text-muted-foreground">Envia pedidos finalizados automaticamente para o ERP</p>
              </div>
              <Switch
                checked={sendOrders}
                onCheckedChange={(val) => onUpdate("erp_send_orders", val ? "true" : "false")}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ações manuais */}
      {erpEnabled && isConfigured && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm">⚡ Ações</h3>
          <button
            disabled={!isConfigured}
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition disabled:opacity-50"
            onClick={() => {/* TODO: chamar edge function de sync */}}
          >
            <RefreshCw className="h-4 w-4" />
            Sincronizar Agora
          </button>
          <p className="text-xs text-muted-foreground">
            Puxa os dados mais recentes do ERP e atualiza o catálogo.
          </p>
        </div>
      )}

      {/* Guia */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Info className="h-4 w-4" />
          Como funciona?
        </h3>
        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>1.</strong> Configure a URL e o token da API do seu ERP acima.</p>
          <p><strong>2.</strong> Escolha quais módulos quer sincronizar (produtos, estoque, pedidos).</p>
          <p><strong>3.</strong> Clique em "Sincronizar Agora" para importar os dados do ERP.</p>
          <p><strong>4.</strong> Os pedidos do catálogo serão enviados automaticamente ao ERP quando habilitado.</p>
          <p className="pt-1 border-t text-muted-foreground/70">
            Compatível com qualquer ERP que possua API REST (Bling, Tiny, Omie, Sankhya, etc).
            Quando tiver sua API pronta, basta preencher os campos acima.
          </p>
        </div>
      </div>
    </div>
  );
}
