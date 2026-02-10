import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Banner {
  id: string;
  image_url: string;
  link: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setBanners(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addBanner = async (image_url: string, link?: string) => {
    const maxOrder = banners.reduce((m, b) => Math.max(m, b.sort_order), -1);
    const { error } = await supabase
      .from("banners")
      .insert({ image_url, link: link || null, sort_order: maxOrder + 1 });
    if (!error) await fetch();
    return { error };
  };

  const updateBanner = async (id: string, data: Partial<Banner>) => {
    const { error } = await supabase.from("banners").update(data).eq("id", id);
    if (!error) await fetch();
    return { error };
  };

  const removeBanner = async (id: string) => {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (!error) await fetch();
    return { error };
  };

  const activeBanners = banners.filter((b) => b.active);

  return { banners, activeBanners, loading, addBanner, updateBanner, removeBanner, refetch: fetch };
}
