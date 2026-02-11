import { useState, useEffect } from "react";
import { productsApi } from "@/lib/api-client";
import type { DbProduct } from "@/hooks/useDbProducts";

export function useProductBySlug(slug: string | undefined) {
  const [product, setProduct] = useState<DbProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const data = await productsApi.findBySlug(slug);
      setProduct(data);
      setLoading(false);
    };

    fetch();
  }, [slug]);

  return { product, loading };
}
