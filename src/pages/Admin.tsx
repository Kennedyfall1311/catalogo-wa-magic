import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDbProducts } from "@/hooks/useDbProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductManager } from "@/components/admin/ProductManager";
import { ExcelImport } from "@/components/admin/ExcelImport";
import { ImageImport } from "@/components/admin/ImageImport";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { IntegrationPanel } from "@/components/admin/IntegrationPanel";
import { CatalogCustomization } from "@/components/admin/CatalogCustomization";
import { SalesDashboard } from "@/components/admin/SalesDashboard";
import { useCatalogTabs } from "@/hooks/useCatalogTabs";
import type { DbProduct } from "@/hooks/useDbProducts";

export default function Admin() {
  const { user, isAdmin, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { products, categories, loading, addProduct, updateProduct, removeProduct, toggleActive, upsertProducts, uploadImage, refetchCategories } = useDbProducts();
  const { settings, updateSetting } = useStoreSettings();
  const { tabs: catalogTabs, addTab, updateTab, removeTab, reorderTabs } = useCatalogTabs();
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"sales" | "products" | "categories" | "import" | "catalog" | "settings" | "integration">("sales");

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
    { key: "sales", label: "Vendas" },
    { key: "products", label: "Produtos" },
    { key: "categories", label: "Categorias" },
    { key: "import", label: "Importar" },
    { key: "catalog", label: "Catálogo" },
    { key: "settings", label: "Config" },
    { key: "integration", label: "ERP" },
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
        <div className="flex border-b mt-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
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
          {tab === "sales" && <SalesDashboard />}

          {tab === "products" && (
            loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : (
              <ProductManager
                products={products}
                categories={categories}
                onEdit={(p) => { setEditing(p); setShowForm(true); }}
                onDelete={removeProduct}
                onToggleActive={toggleActive}
                onUploadImage={uploadImage}
                onUpdateProduct={updateProduct}
                onAddNew={() => { setEditing(null); setShowForm(true); }}
                showForm={showForm}
                formSlot={
                  showForm ? (
                    <ProductForm
                      product={editing}
                      categories={categories}
                      onSave={handleSave}
                      onCancel={() => { setShowForm(false); setEditing(null); }}
                      onUploadImage={uploadImage}
                    />
                  ) : undefined
                }
              />
            )
          )}

          {tab === "categories" && (
            <CategoryManager categories={categories} onRefresh={refetchCategories} />
          )}

          {tab === "import" && (
            <div className="space-y-4">
              <ExcelImport categories={categories} onImport={upsertProducts} onRefreshCategories={refetchCategories} />
              <ImageImport onComplete={() => {}} />
            </div>
          )}

          {tab === "catalog" && (
            <CatalogCustomization
              settings={settings}
              onUpdate={updateSetting}
              products={products}
              categories={categories}
              onUpdateProduct={updateProduct}
              catalogTabs={catalogTabs}
              onAddTab={addTab}
              onUpdateTab={updateTab}
              onRemoveTab={removeTab}
              onReorderTabs={reorderTabs}
            />
          )}

          {tab === "settings" && (
            <SettingsPanel settings={settings} onUpdate={updateSetting} />
          )}

          {tab === "integration" && (
            <IntegrationPanel settings={settings} onUpdate={updateSetting} />
          )}
        </main>
      </div>
    </div>
  );
}