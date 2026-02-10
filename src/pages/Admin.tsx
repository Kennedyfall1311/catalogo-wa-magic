import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductList } from "@/components/admin/ProductList";
import { ExcelImport } from "@/components/admin/ExcelImport";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { CategoryManager } from "@/components/admin/CategoryManager";
import type { DbProduct } from "@/hooks/useDbProducts";

export default function Admin() {
  const { user, isAdmin, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { products, categories, loading, addProduct, updateProduct, removeProduct, toggleActive, upsertProducts, uploadImage, refetchCategories } = useDbProducts();
  const { settings, updateSetting } = useStoreSettings();
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"products" | "categories" | "import" | "settings">("products");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLogin={signIn} onSignUp={signUp} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-lg font-semibold">Acesso negado</p>
        <p className="text-sm text-muted-foreground text-center">
          Sua conta não tem permissão de administrador.
        </p>
        <div className="flex gap-2">
          <Link to="/" className="text-sm underline text-muted-foreground">Voltar ao catálogo</Link>
          <button onClick={signOut} className="text-sm underline text-muted-foreground">Sair</button>
        </div>
      </div>
    );
  }

  const handleSave = async (data: any) => {
    if (editing) {
      await updateProduct(editing.id, data);
    } else {
      await addProduct(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  const tabs = [
    { key: "products", label: "Produtos" },
    { key: "categories", label: "Categorias" },
    { key: "import", label: "Importar" },
    { key: "settings", label: "Config" },
  ] as const;

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
          <button onClick={signOut} className="rounded-full p-2 hover:bg-muted transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="container max-w-3xl">
        {/* Tabs */}
        <div className="flex border-b mt-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <main className="py-6 space-y-4">
          {tab === "products" && (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">{products.length} Produtos</h1>
                <button
                  onClick={() => { setEditing(null); setShowForm(true); }}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                >
                  <Plus className="h-4 w-4" /> Novo
                </button>
              </div>

              {showForm && (
                <ProductForm
                  product={editing}
                  categories={categories}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditing(null); }}
                  onUploadImage={uploadImage}
                />
              )}

              {loading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : (
                <ProductList
                  products={products}
                  categories={categories}
                  onEdit={(p) => { setEditing(p); setShowForm(true); }}
                  onDelete={removeProduct}
                  onToggleActive={toggleActive}
                />
              )}
            </>
          )}

          {tab === "categories" && (
            <CategoryManager categories={categories} onRefresh={refetchCategories} />
          )}

          {tab === "import" && (
            <ExcelImport categories={categories} onImport={upsertProducts} />
          )}

          {tab === "settings" && (
            <SettingsPanel settings={settings} onUpdate={updateSetting} />
          )}
        </main>
      </div>
    </div>
  );
}
