import { useState, useEffect, useCallback } from "react";
import { isPostgresMode } from "@/lib/api-client";

export interface CatalogTab {
  id: string;
  name: string;
  filter_type: string; // 'all' | 'category' | 'promotion' | 'featured'
  filter_value: string | null;
  sort_order: number;
  active: boolean;
  icon: string | null;
  created_at: string;
}

export function useCatalogTabs() {
  const [tabs, setTabs] = useState<CatalogTab[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTabs = useCallback(async () => {
    if (isPostgresMode()) {
      setTabs([]);
      setLoading(false);
      return;
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase
      .from("catalog_tabs")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setTabs(data as unknown as CatalogTab[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  const addTab = async (tab: { name: string; filter_type: string; filter_value?: string | null; icon?: string }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const maxOrder = tabs.length > 0 ? Math.max(...tabs.map((t) => t.sort_order)) + 1 : 0;
    const { error } = await supabase.from("catalog_tabs").insert({
      name: tab.name,
      filter_type: tab.filter_type,
      filter_value: tab.filter_value || null,
      sort_order: maxOrder,
      icon: tab.icon || null,
    } as any);
    if (!error) await fetchTabs();
    return { error };
  };

  const updateTab = async (id: string, data: Partial<CatalogTab>) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("catalog_tabs").update(data as any).eq("id", id);
    if (!error) await fetchTabs();
    return { error };
  };

  const removeTab = async (id: string) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("catalog_tabs").delete().eq("id", id);
    if (!error) await fetchTabs();
    return { error };
  };

  const reorderTabs = async (reorderedTabs: CatalogTab[]) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const updates = reorderedTabs.map((t, i) =>
      supabase.from("catalog_tabs").update({ sort_order: i } as any).eq("id", t.id)
    );
    await Promise.all(updates);
    await fetchTabs();
  };

  const activeTabs = tabs.filter((t) => t.active);

  return { tabs, activeTabs, loading, addTab, updateTab, removeTab, reorderTabs, refetch: fetchTabs };
}
