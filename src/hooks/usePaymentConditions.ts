import { useState, useEffect, useCallback } from "react";
import { paymentConditionsApi, realtimeApi } from "@/lib/api-client";

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
    const data = await paymentConditionsApi.fetchAll();
    if (data) setConditions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const unsub = realtimeApi.subscribeToTable("payment_conditions", () => fetch());
    return () => unsub();
  }, [fetch]);

  const addCondition = async (name: string) => {
    const maxOrder = conditions.length > 0 ? Math.max(...conditions.map(c => c.sort_order)) + 1 : 0;
    const { error } = await paymentConditionsApi.insert(name, maxOrder);
    if (!error) await fetch();
    return { error };
  };

  const updateCondition = async (id: string, updates: Partial<Pick<PaymentCondition, "name" | "active" | "sort_order">>) => {
    const { error } = await paymentConditionsApi.update(id, updates);
    if (!error) await fetch();
    return { error };
  };

  const removeCondition = async (id: string) => {
    const { error } = await paymentConditionsApi.remove(id);
    if (!error) await fetch();
    return { error };
  };

  return { conditions, loading, addCondition, updateCondition, removeCondition, refetch: fetch };
}
