import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentCondition {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export function usePaymentConditions() {
  const [conditions, setConditions] = useState<PaymentCondition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("payment_conditions")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setConditions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel("payment-conditions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_conditions" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const addCondition = async (name: string) => {
    const maxOrder = conditions.length > 0 ? Math.max(...conditions.map(c => c.sort_order)) + 1 : 0;
    const { error } = await supabase.from("payment_conditions").insert({ name, sort_order: maxOrder });
    if (!error) await fetch();
    return { error };
  };

  const updateCondition = async (id: string, updates: Partial<Pick<PaymentCondition, "name" | "active" | "sort_order">>) => {
    const { error } = await supabase.from("payment_conditions").update(updates).eq("id", id);
    if (!error) await fetch();
    return { error };
  };

  const removeCondition = async (id: string) => {
    const { error } = await supabase.from("payment_conditions").delete().eq("id", id);
    if (!error) await fetch();
    return { error };
  };

  return { conditions, loading, addCondition, updateCondition, removeCondition, refetch: fetch };
}
