import { useState } from "react";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { usePaymentConditions } from "@/hooks/usePaymentConditions";

interface Props {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function PaymentConditionsManager({ enabled, onToggle }: Props) {
  const { conditions, addCondition, updateCondition, removeCondition } = usePaymentConditions();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    await addCondition(newName.trim());
    setNewName("");
    setAdding(false);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <CreditCard className="h-5 w-5" />
        Condições de Pagamento
      </h2>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Ativar condições de pagamento</p>
          <p className="text-xs text-muted-foreground">
            Exibir opções de pagamento no checkout
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && (
        <>
          <div className="flex gap-2">
            <input
              placeholder="Ex: PIX, Cartão de Crédito, Boleto..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>

          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma condição cadastrada
            </p>
          ) : (
            <div className="space-y-2">
              {conditions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={c.active}
                      onCheckedChange={(checked) =>
                        updateCondition(c.id, { active: checked })
                      }
                    />
                    <span className={`text-sm ${!c.active ? "text-muted-foreground line-through" : ""}`}>
                      {c.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeCondition(c.id)}
                    className="rounded-full p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
