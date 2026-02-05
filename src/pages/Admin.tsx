import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { CATEGORIES, type Product } from "@/types/product";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const ADMIN_PASS = "admin123";

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyForm = {
  name: "",
  slug: "",
  price: "",
  originalPrice: "",
  description: "",
  image: "",
  category: "roupas",
  active: true,
};

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const { products, addProduct, updateProduct, removeProduct, toggleActive } = useProducts();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-center">Área Administrativa</h1>
          <p className="text-sm text-muted-foreground text-center">Digite a senha para acessar</p>
          <input
            type="password"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (pass === ADMIN_PASS) setAuthed(true);
                else setError("Senha incorreta");
              }
            }}
            placeholder="Senha"
            className="w-full rounded-lg border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            onClick={() => {
              if (pass === ADMIN_PASS) setAuthed(true);
              else setError("Senha incorreta");
            }}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Entrar
          </button>
          <Link to="/" className="block text-center text-sm text-muted-foreground underline">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    );
  }

  const startEdit = (p: Product) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : "",
      description: p.description,
      image: p.image,
      category: p.category,
      active: p.active,
    });
    setShowForm(true);
  };

  const startNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    const data = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
      description: form.description,
      image: form.image || "/placeholder.svg",
      category: form.category,
      active: form.active,
    };
    if (editing) {
      updateProduct(editing, data);
    } else {
      addProduct(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-full p-2 hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="font-semibold">Painel Admin</span>
          </div>
          <button onClick={() => setAuthed(false)} className="rounded-full p-2 hover:bg-muted transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="container py-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{products.length} Produtos</h1>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> Novo
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border bg-card p-4 space-y-3 animate-fade-in">
            <h2 className="font-semibold">{editing ? "Editar Produto" : "Novo Produto"}</h2>
            <input
              placeholder="Nome do produto *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
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
              />
              <input
                placeholder="Preço original (opcional)"
                type="number"
                step="0.01"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
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
            <input
              placeholder="URL da imagem"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                Salvar
              </button>
              <button
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <img
                src={p.image}
                alt={p.name}
                className="h-12 w-12 rounded-md object-cover bg-muted shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${!p.active ? "opacity-50" : ""}`}>
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  R$ {p.price.toFixed(2).replace(".", ",")}
                  {" · "}
                  {CATEGORIES.find((c) => c.slug === p.category)?.name || p.category}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleActive(p.id)}
                  className="rounded-full p-2 hover:bg-muted transition-colors"
                  title={p.active ? "Desativar" : "Ativar"}
                >
                  {p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-50" />}
                </button>
                <button
                  onClick={() => startEdit(p)}
                  className="rounded-full p-2 hover:bg-muted transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeProduct(p.id)}
                  className="rounded-full p-2 hover:bg-muted transition-colors text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
