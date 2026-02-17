import { useState, useEffect, useCallback } from "react";
import { ordersApi, realtimeApi } from "@/lib/api-client";

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_cpf_cnpj: string | null;
  payment_method: string | null;
  notes: string | null;
  seller_id: string | null;
  seller_name: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_code: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const data = await ordersApi.fetchAll();
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const unsub = realtimeApi.subscribeToTable("orders", () => fetchOrders());
    return () => unsub();
  }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await ordersApi.updateStatus(id, status);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
    return { error };
  };

  const fetchItems = async (orderId: string): Promise<OrderItem[]> => {
    return ordersApi.fetchItems(orderId);
  };

  return { orders, loading, updateStatus, fetchItems, refetch: fetchOrders };
}
