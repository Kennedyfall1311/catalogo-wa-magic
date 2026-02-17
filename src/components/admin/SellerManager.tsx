import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit2, Copy, Check, X, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { sellersApi } from "@/lib/api-client";
import { toast } from "sonner";

interface Seller {
  id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  active: boolean;
  created_at: string;
}

export function SellerManager() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Seller | null>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchSellers = useCallback(async () => {
    const data = await sellersApi.fetchAll();
    setSellers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async () => {
    if (!name.trim()) return;
    const slug = generateSlug(name);
    const payload: any = { name: name.trim(), slug, whatsapp: whatsapp.replace(/\D/g, "") || null };

    if (editing) {
      const { error } = await sellersApi.update(editing.id, payload);
      if (error) { toast.error("Erro ao atualizar vendedor"); return; }
      toast.success("Vendedor atualizado");
    } else {
      const { error } = await sellersApi.insert(payload);
      if (error) { toast.error("Erro ao criar vendedor"); return; }
      toast.success("Vendedor criado");
    }
    resetForm();
    fetchSellers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este vendedor?")) return;
    const { error } = await sellersApi.remove(id);
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Vendedor removido");
    fetchSellers();
  };

  const handleToggle = async (seller: Seller) => {
    await sellersApi.update(seller.id, { active: !seller.active });
    fetchSellers();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setName("");
    setWhatsapp("");
  };

  const startEdit = (s: Seller) => {
    setEditing(s);
    setName(s.name);
    setWhatsapp(s.whatsapp || "");
    setShowForm(true);
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/v/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(slug);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Vendedores ({sellers.length})
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Vendedor
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <h3 className="text-sm font-semibold">{editing ? "Editar Vendedor" : "Novo Vendedor"}</h3>
          <div className="space-y-2">
            <Label htmlFor="seller-name">Nome *</Label>
            <Input id="seller-name" placeholder="Nome do vendedor" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seller-whatsapp">WhatsApp (opcional)</Label>
            <Input id="seller-whatsapp" placeholder="(00) 00000-0000" value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} />
            <p className="text-[10px] text-muted-foreground">
              Se preenchido, o pedido será enviado para este número. Caso contrário, vai para o WhatsApp da loja.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition">
              <Check className="h-3.5 w-3.5" />
              Salvar
            </button>
            <button onClick={resetForm} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition">
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {sellers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum vendedor cadastrado. Crie um vendedor para gerar links personalizados.
        </p>
      ) : (
        <div className="space-y-2">
          {sellers.map((s) => (
            <div key={s.id} className={`rounded-lg border p-3 flex items-center gap-3 transition ${!s.active ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {window.location.origin}/v/{s.slug}
                </p>
                {s.whatsapp && (
                  <p className="text-[10px] text-muted-foreground">WhatsApp: {s.whatsapp}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Switch checked={s.active} onCheckedChange={() => handleToggle(s)} />
                <button onClick={() => copyLink(s.slug)} className="rounded-full p-1.5 hover:bg-muted transition" title="Copiar link">
                  {copiedId === s.slug ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => startEdit(s)} className="rounded-full p-1.5 hover:bg-muted transition" title="Editar">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="rounded-full p-1.5 hover:bg-muted text-destructive transition" title="Remover">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
