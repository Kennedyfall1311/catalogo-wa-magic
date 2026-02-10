import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DbProduct = Tables<"products">;
export type DbCategory = Tables<"categories">;

export function useDbProducts() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProducts(data);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  }, []);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).then(() => setLoading(false));

    // Realtime: refresh products when changes happen
    const channel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => { fetchProducts(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => { fetchCategories(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchProducts, fetchCategories]);

  const addProduct = async (product: TablesInsert<"products">) => {
    const { error } = await supabase.from("products").insert(product);
    if (!error) await fetchProducts();
    return { error };
  };

  const updateProduct = async (id: string, data: Partial<TablesInsert<"products">>) => {
    const { error } = await supabase.from("products").update(data).eq("id", id);
    if (!error) await fetchProducts();
    return { error };
  };

  const removeProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) await fetchProducts();
    return { error };
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    return updateProduct(id, { active: !currentActive });
  };

  const upsertProducts = async (rows: TablesInsert<"products">[]) => {
    const { error } = await supabase.from("products").upsert(rows, { onConflict: "code" });
    if (!error) await fetchProducts();
    return { error };
  };

  const uploadImage = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) return { url: null, error };
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  };

  return {
    products,
    categories,
    loading,
    addProduct,
    updateProduct,
    removeProduct,
    toggleActive,
    upsertProducts,
    uploadImage,
    refetch: fetchProducts,
    refetchCategories: fetchCategories,
  };
}
