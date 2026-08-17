import { useState, useEffect, useCallback } from "react";
import { productsApi, categoriesApi, storageApi, realtimeApi } from "@/lib/api-client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DbProduct = Tables<"products">;
export type DbCategory = Tables<"categories">;

export function useDbProducts() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productsApi.fetchAll();
      if (data) setProducts(data);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar produtos:", err);
      setError("Não foi possível carregar os produtos. Verifique sua conexão.");
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.fetchAll();
      if (data) setCategories(data);
    } catch (err: any) {
      console.error("Erro ao carregar categorias:", err);
    }
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
    // Fetch current products to avoid creating duplicates on re-imports
    let existing: DbProduct[] = products;
    try {
      const fresh = await productsApi.fetchAll();
      if (fresh) existing = fresh;
    } catch {
      /* fallback to state */
    }

    const byCode = new Map<string, DbProduct>();
    const bySlug = new Map<string, DbProduct>();
    existing.forEach((p) => {
      if (p.code) byCode.set(String(p.code).trim().toLowerCase(), p);
      if (p.slug) bySlug.set(p.slug, p);
    });

    // 1. Deduplicate incoming rows (same code / same slug = same product, last wins)
    const deduped = new Map<string, TablesInsert<"products">>();
    rows.forEach((row) => {
      const key = row.code ? `c:${String(row.code).trim().toLowerCase()}` : `s:${row.slug}`;
      const prev = deduped.get(key);
      deduped.set(key, prev ? { ...prev, ...row } : row);
    });

    const toUpsert: TablesInsert<"products">[] = [];
    const toUpdate: { id: string; data: Partial<TablesInsert<"products">> }[] = [];

    deduped.forEach((row) => {
      const match =
        (row.code ? byCode.get(String(row.code).trim().toLowerCase()) : undefined) ||
        (row.slug ? bySlug.get(row.slug) : undefined);

      // Never wipe an existing image with the placeholder
      const data: any = { ...row };
      if (match && (!data.image_url || data.image_url === "/placeholder.svg")) {
        delete data.image_url;
      }

      if (match) {
        toUpdate.push({ id: match.id, data });
      } else if (row.code) {
        toUpsert.push(row);
      } else {
        toUpsert.push(row);
      }
    });

    // 2. Update matched products by id (no duplicates possible)
    for (const item of toUpdate) {
      const { error } = await productsApi.update(item.id, item.data);
      if (error) return { error };
    }

    // 3. Insert/upsert only genuinely new products
    if (toUpsert.length > 0) {
      const { error } = await productsApi.upsert(toUpsert);
      if (error) return { error };
    }

    await fetchProducts();
    return { error: null };
  };


  const uploadImage = async (file: File) => {
    return storageApi.uploadFile(file);
  };

  return {
    products,
    categories,
    loading,
    error,
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
