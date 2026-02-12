/**
 * API Client Abstraction Layer
 *
 * Detects the mode via VITE_API_MODE env variable:
 * - "postgres" → calls REST API (Express backend)
 * - default    → uses Supabase client (existing behavior)
 *
 * All hooks and components should use these functions instead of
 * importing supabase directly.
 */

const API_MODE = import.meta.env.VITE_API_MODE || "supabase";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const isPostgresMode = () => API_MODE === "postgres";

// ─── Timeout & Retry Config ───

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const timeout = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable =
        err.name === "AbortError" ||
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError");
      if (!isRetryable || attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw new Error("Unreachable");
}

// ─── Generic REST helpers ───

async function restGet<T>(path: string): Promise<T> {
  return withRetry(async () => {
    const res = await fetchWithTimeout(`${API_URL}${path}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

async function restPost<T>(path: string, body: any, headers?: Record<string, string>): Promise<T> {
  return withRetry(async () => {
    const res = await fetchWithTimeout(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return res.json();
  });
}

async function restPut<T>(path: string, body: any): Promise<T> {
  return withRetry(async () => {
    const res = await fetchWithTimeout(`${API_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
}

async function restDelete(path: string): Promise<void> {
  return withRetry(async () => {
    const res = await fetchWithTimeout(`${API_URL}${path}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  });
}

// ─── Products API ───

export const productsApi = {
  async fetchAll() {
    if (isPostgresMode()) {
      return restGet<any[]>("/products");
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    return data || [];
  },

  async findBySlug(slug: string) {
    if (isPostgresMode()) {
      return restGet<any | null>(`/products/slug/${slug}`);
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("products").select("*").eq("slug", slug).eq("active", true).maybeSingle();
    return data;
  },

  async findByCode(code: string) {
    if (isPostgresMode()) {
      return restGet<any[]>(`/products/code/${encodeURIComponent(code)}`);
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("products").select("id").eq("code", code).limit(1);
    return data || [];
  },

  async insert(product: any) {
    if (isPostgresMode()) {
      try {
        await restPost("/products", product);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("products").insert(product);
    return { error };
  },

  async update(id: string, data: any) {
    if (isPostgresMode()) {
      try {
        await restPut(`/products/${id}`, data);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("products").update(data).eq("id", id);
    return { error };
  },

  async remove(id: string) {
    if (isPostgresMode()) {
      try {
        await restDelete(`/products/${id}`);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("products").delete().eq("id", id);
    return { error };
  },

  async upsert(rows: any[]) {
    if (isPostgresMode()) {
      try {
        await restPost("/products/upsert", { products: rows });
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("products").upsert(rows, { onConflict: "code" });
    return { error };
  },
};

// ─── Categories API ───

export const categoriesApi = {
  async fetchAll() {
    if (isPostgresMode()) {
      return restGet<any[]>("/categories");
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("categories").select("*").order("name");
    return data || [];
  },

  async insert(cat: { name: string; slug: string }) {
    if (isPostgresMode()) {
      try {
        const data = await restPost<any>("/categories", cat);
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("categories").insert(cat);
    return { data: null, error };
  },

  async insertBatch(cats: { name: string; slug: string }[]) {
    if (isPostgresMode()) {
      try {
        const data = await restPost<any[]>("/categories/batch", { categories: cats });
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.from("categories").insert(cats).select();
    return { data, error };
  },

  async update(id: string, data: { name: string; slug: string }) {
    if (isPostgresMode()) {
      try {
        await restPut(`/categories/${id}`, data);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("categories").update(data).eq("id", id);
    return { error };
  },

  async remove(id: string) {
    if (isPostgresMode()) {
      try {
        await restDelete(`/categories/${id}`);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("categories").delete().eq("id", id);
    return { error };
  },
};

// ─── Settings API ───

export const settingsApi = {
  async fetchAll() {
    if (isPostgresMode()) {
      return restGet<{ key: string; value: string }[]>("/settings");
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("store_settings").select("*");
    return data || [];
  },

  async update(key: string, value: string) {
    if (isPostgresMode()) {
      try {
        await restPut(`/settings/${key}`, { value });
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("store_settings").upsert({ key, value }, { onConflict: "key" });
    return { error };
  },
};

// ─── Banners API ───

export const bannersApi = {
  async fetchAll() {
    if (isPostgresMode()) {
      return restGet<any[]>("/banners");
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("banners").select("*").order("sort_order", { ascending: true });
    return data || [];
  },

  async insert(banner: { image_url: string; link?: string | null; sort_order: number }) {
    if (isPostgresMode()) {
      try {
        await restPost("/banners", banner);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("banners").insert(banner);
    return { error };
  },

  async update(id: string, data: any) {
    if (isPostgresMode()) {
      try {
        await restPut(`/banners/${id}`, data);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("banners").update(data).eq("id", id);
    return { error };
  },

  async remove(id: string) {
    if (isPostgresMode()) {
      try {
        await restDelete(`/banners/${id}`);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("banners").delete().eq("id", id);
    return { error };
  },
};

// ─── Payment Conditions API ───

export const paymentConditionsApi = {
  async fetchAll() {
    if (isPostgresMode()) {
      return restGet<any[]>("/payment-conditions");
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("payment_conditions").select("*").order("sort_order", { ascending: true });
    return data || [];
  },

  async insert(name: string, sort_order: number) {
    if (isPostgresMode()) {
      try {
        await restPost("/payment-conditions", { name, sort_order });
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("payment_conditions").insert({ name, sort_order });
    return { error };
  },

  async update(id: string, updates: any) {
    if (isPostgresMode()) {
      try {
        await restPut(`/payment-conditions/${id}`, updates);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("payment_conditions").update(updates).eq("id", id);
    return { error };
  },

  async remove(id: string) {
    if (isPostgresMode()) {
      try {
        await restDelete(`/payment-conditions/${id}`);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("payment_conditions").delete().eq("id", id);
    return { error };
  },
};

// ─── Storage / Upload API ───

export const storageApi = {
  async uploadFile(file: File): Promise<{ url: string | null; error: any }> {
    if (isPostgresMode()) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_URL}/upload/image`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error(await res.text());
        const { url } = await res.json();
        return { url, error: null };
      } catch (err: any) {
        return { url: null, error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) return { url: null, error };
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  },

  async uploadBase64(base64: string): Promise<{ url: string | null; error: any }> {
    if (isPostgresMode()) {
      try {
        const res = await fetch(`${API_URL}/upload/base64`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64 }),
        });
        if (!res.ok) throw new Error(await res.text());
        const { url } = await res.json();
        return { url, error: null };
      } catch (err: any) {
        return { url: null, error: { message: err.message } };
      }
    }
    // Supabase mode
    const { supabase } = await import("@/integrations/supabase/client");
    const clean = base64.replace(/^data:image\/\w+;base64,/, "").replace(/\s/g, "");
    let ext = "jpg";
    if (clean.startsWith("iVBOR")) ext = "png";
    else if (clean.startsWith("R0lGO")) ext = "gif";
    else if (clean.startsWith("UklGR")) ext = "webp";

    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: `image/${ext}` });

    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, blob, { contentType: `image/${ext}` });
    if (error) return { url: null, error };
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  },
};

// ─── Auth API ───

export const authApi = {
  async getSession() {
    if (isPostgresMode()) {
      return {
        user: { id: "local-admin", email: "admin@local" } as any,
        isAdmin: true,
        session: {} as any,
      };
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { session } } = await supabase.auth.getSession();
    return { user: session?.user ?? null, session, isAdmin: false };
  },

  async checkAdmin(userId: string): Promise<boolean> {
    if (isPostgresMode()) return true;
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  },

  async signIn(email: string, password: string) {
    if (isPostgresMode()) {
      return { error: null };
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  },

  async signUp(email: string, password: string) {
    if (isPostgresMode()) {
      return { error: null };
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  },

  async signOut() {
    if (isPostgresMode()) return;
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
  },

  onAuthStateChange(callback: (user: any, session: any) => void): () => void {
    if (isPostgresMode()) {
      // Immediately call with mock admin
      setTimeout(() => callback(
        { id: "local-admin", email: "admin@local" },
        {}
      ), 0);
      return () => {};
    }
    // Lazy import for supabase
    let unsubscribe = () => {};
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          callback(session?.user ?? null, session);
        }
      );
      unsubscribe = () => subscription.unsubscribe();
    });
    return () => unsubscribe();
  },

  async setupAdmin() {
    if (isPostgresMode()) {
      return { error: null, data: { message: "Admin mode is always on in PostgreSQL mode" } };
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const res = await supabase.functions.invoke("setup-admin");
    return res;
  },
};

// ─── Orders API ───

export const ordersApi = {
  async fetchAll() {
    if (isPostgresMode()) {
      return restGet<any[]>("/orders");
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    return data || [];
  },

  async fetchItems(orderId: string) {
    if (isPostgresMode()) {
      return restGet<any[]>(`/orders/${orderId}/items`);
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    return data || [];
  },

  async create(order: any, items: any[], idempotencyKey?: string) {
    if (isPostgresMode()) {
      try {
        const headers: Record<string, string> = {};
        if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;
        await restPost("/orders", { order, items }, headers);
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.from("orders").insert(order).select("id").single();
    if (error) return { error };
    const orderItems = items.map((i) => ({ ...i, order_id: data.id }));
    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    return { error: itemsError };
  },

  async updateStatus(id: string, status: string) {
    if (isPostgresMode()) {
      try {
        await restPut(`/orders/${id}`, { status });
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    return { error };
  },
};

// ─── Realtime (only works in Supabase mode) ───

export const realtimeApi = {
  subscribeToTable(table: string, callback: () => void): () => void {
    if (isPostgresMode()) {
      const interval = setInterval(callback, 5000);
      return () => clearInterval(interval);
    }

    let cleanup = () => {};
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const channel = supabase
        .channel(`${table}-changes`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => callback())
        .subscribe();
      cleanup = () => supabase.removeChannel(channel);
    });
    return () => cleanup();
  },
};
