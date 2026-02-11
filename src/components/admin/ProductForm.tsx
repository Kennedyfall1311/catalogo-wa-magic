import { useState } from "react";
import type { DbProduct, DbCategory } from "@/hooks/useDbProducts";
import { Upload } from "lucide-react";

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface ProductFormProps {
  product?: DbProduct | null;
  categories: DbCategory[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  onUploadImage: (file: File) => Promise<{ url: string | null; error: any }>;
}

export function ProductForm({ product, categories, onSave, onCancel, onUploadImage }: ProductFormProps) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    code: product?.code ?? "",
    price: product?.price ? String(product.price) : "",
    original_price: product?.original_price ? String(product.original_price) : "",
    description: product?.description ?? "",
    image_url: product?.image_url ?? "",
    category_id: product?.category_id ?? "",
    active: product?.active ?? true,
    reference: (product as any)?.reference ?? "",
    manufacturer_code: (product as any)?.manufacturer_code ?? "",
    unit_of_measure: (product as any)?.unit_of_measure ?? "",
    quantity: (product as any)?.quantity ? String((product as any).quantity) : "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url } = await onUploadImage(file);
    if (url) setForm((f) => ({ ...f, image_url: url }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);
    await onSave({
      name: form.name,
      code: form.code || null,
      slug: slugify(form.name),
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      description: form.description,
      image_url: form.image_url || "/placeholder.svg",
      category_id: form.category_id || null,
      active: form.active,
      reference: form.reference || null,
      manufacturer_code: form.manufacturer_code || null,
      unit_of_measure: form.unit_of_measure || null,
      quantity: form.quantity ? parseFloat(form.quantity) : null,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-3 animate-fade-in">
      <h2 className="font-semibold">{product ? "Editar Produto" : "Novo Produto"}</h2>

      <input
        placeholder="Nome do produto *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        required
      />

      <input
        placeholder="Código do produto"
        value={form.code}
        onChange={(e) => setForm({ ...form, code: e.target.value })}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Preço *"
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <input
          placeholder="Preço original"
          type="number"
          step="0.01"
          value={form.original_price}
          onChange={(e) => setForm({ ...form, original_price: e.target.value })}
          className="rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <textarea
        placeholder="Descrição"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        rows={2}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {form.image_url && form.image_url !== "/placeholder.svg" && (
            <img src={form.image_url} alt="Preview" className="h-12 w-12 rounded-md object-cover bg-muted" />
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm hover:bg-muted transition-colors">
            <Upload className="h-4 w-4" />
            {uploading ? "Enviando..." : "Upload de imagem"}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
        <input
          placeholder="Ou cole a URL da imagem"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <input
        placeholder="Referência"
        value={form.reference}
        onChange={(e) => setForm({ ...form, reference: e.target.value })}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

      <input
        placeholder="Código do fabricante"
        value={form.manufacturer_code}
        onChange={(e) => setForm({ ...form, manufacturer_code: e.target.value })}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Unidade de medida"
          value={form.unit_of_measure}
          onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}
          className="rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          placeholder="Quantidade"
          type="number"
          step="0.01"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className="rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <select
        value={form.category_id}
        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Sem categoria</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
