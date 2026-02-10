import { useRef, useState } from "react";
import { ImageIcon, Upload, Trash2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBanners } from "@/hooks/useBanners";
import { Switch } from "@/components/ui/switch";

export function BannerManager() {
  const { banners, addBanner, updateBanner, removeBanner } = useBanners();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banner-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      await addBanner(data.publicUrl);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Banners (Carrossel)
      </h3>

      <p className="text-xs text-muted-foreground">
        Adicione múltiplas imagens para exibir em carrossel no topo do catálogo.
      </p>

      {/* Banner list */}
      <div className="space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="flex items-start gap-3 rounded-lg border p-3">
            <GripVertical className="h-4 w-4 mt-2 text-muted-foreground shrink-0" />
            <img src={b.image_url} alt="Banner" className="h-16 w-24 rounded border object-cover shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <input
                type="text"
                placeholder="Link (opcional)"
                value={b.link || ""}
                onChange={(e) => updateBanner(b.id, { link: e.target.value || null })}
                className="w-full rounded-lg border bg-muted/50 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={b.active}
                  onCheckedChange={(val) => updateBanner(b.id, { active: val })}
                />
                <span className="text-xs text-muted-foreground">{b.active ? "Ativo" : "Inativo"}</span>
              </div>
            </div>
            <button
              onClick={() => removeBanner(b.id)}
              className="rounded p-1.5 hover:bg-destructive/10 text-destructive transition shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Upload button */}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition">
        <Upload className="h-4 w-4" />
        {uploading ? "Enviando..." : "Adicionar Banner"}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
      </label>
    </div>
  );
}
