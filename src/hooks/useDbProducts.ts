import { useState, useEffect, useCallback } from "react";
import { productsApi, categoriesApi, storageApi, realtimeApi } from "@/lib/api-client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DbProduct = Tables<"products">;
export type DbCategory = Tables<"categories">;

export function useDbProducts() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const data = await productsApi.fetchAll();
    if (data) setProducts(data);
  }, []);

  const fetchCategories = useCallback(async () => {
    const data = await categoriesApi.fetchAll();
    if (data) setCategories(data);
  }, []);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).then(() => setLoading(false));

    const unsubProducts = realtimeApi.subscribeToTable("products", () => fetchProducts());
    const unsubCategories = realtimeApi.subscribeToTable("categories", () => fetchCategories());

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, [fetchProducts, fetchCategories]);

  const addProduct = async (product: TablesInsert<"products">) => {
    const { error } = await productsApi.insert(product);
    if (!error) await fetchProducts();
    return { error };
  };

  const updateProduct = async (id: string, data: Partial<TablesInsert<"products">>) => {
    const { error } = await productsApi.update(id, data);
    if (!error) await fetchProducts();
    return { error };
  };

  const removeProduct = async (id: string) => {
    const { error } = await productsApi.remove(id);
    if (!error) await fetchProducts();
    return { error };
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    return updateProduct(id, { active: !currentActive });
  };

  const upsertProducts = async (rows: TablesInsert<"products">[]) => {
    const { error } = await productsApi.upsert(rows);
    if (!error) await fetchProducts();
    return { error };
  };

  const uploadImage = async (file: File) => {
    return storageApi.uploadFile(file);
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
