import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      setProduct(data);
      setLoading(false);
    };

    fetch();
  }, [slug]);

  return { product, loading };
}
