import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, LogOut, BarChart3, Package, FolderOpen,
  FileDown, Palette, Settings, Plug, Users, Warehouse, Monitor
} from "lucide-react";
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
import { SellerManager } from "@/components/admin/SellerManager";
import { StockManager } from "@/components/admin/StockManager";
import { TvModeSettings } from "@/components/admin/TvModeSettings";

import type { DbProduct } from "@/hooks/useDbProducts";

const TABS = [
  { key: "sales", label: "Vendas", icon: BarChart3 },
  { key: "products", label: "Produtos", icon: Package },
  { key: "categories", label: "Categorias", icon: FolderOpen },
  { key: "sellers", label: "Vendedores", icon: Users },
  { key: "stock", label: "Estoque", icon: Warehouse },
  { key: "tv", label: "Modo TV", icon: Monitor },
  { key: "import", label: "Importar", icon: FileDown },
  { key: "catalog", label: "Catálogo", icon: Palette },
  { key: "settings", label: "Config", icon: Settings },
  { key: "integration", label: "ERP", icon: Plug },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function Admin() {
  const { user, isAdmin, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { products, categories, loading, addProduct, updateProduct, removeProduct, toggleActive, upsertProducts, uploadImage, refetchCategories } = useDbProducts();
  const { settings, updateSetting } = useStoreSettings();

  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<TabKey>("sales");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
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

  const storeName = settings.store_name || "Painel Admin";

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-md shadow-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-full p-2 hover:bg-muted transition-colors" title="Voltar ao catálogo">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm">{storeName}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Administração</span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <div className="container max-w-3xl">
        {/* ─── Tabs ─── */}
        <nav className="flex border-b mt-1 overflow-x-auto scrollbar-none">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`group relative flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {t.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ─── Content ─── */}
        <main className="py-6 space-y-4">
          {tab === "sales" && <SalesDashboard />}

          {tab === "products" && (
            loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              </div>
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

          {tab === "sellers" && <SellerManager />}

          {tab === "stock" && (
            <StockManager
              products={products}
              categories={categories}
              onUpdateProduct={updateProduct}
              hideOutOfStock={settings.hide_out_of_stock === "true"}
              onToggleHideOutOfStock={(val) => updateSetting("hide_out_of_stock", val)}
            />
          )}

          {tab === "tv" && (
            <TvModeSettings settings={settings} onUpdate={updateSetting} />
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
            />
          )}

          {tab === "settings" && (
            <SettingsPanel settings={settings} onUpdate={updateSetting} />
          )}

          {tab === "integration" && (
            <IntegrationPanel settings={settings} onUpdate={updateSetting} />
          )}
        </main>

        {/* ─── Footer ─── */}
        <footer className="border-t py-4 text-center">
          <p className="text-[10px] text-muted-foreground">
            {storeName} · Painel Administrativo
          </p>
        </footer>
      </div>
    </div>
  );
}
