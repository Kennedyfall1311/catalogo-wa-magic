import { useState, useEffect, useCallback, useRef } from "react";
import { settingsApi, realtimeApi } from "@/lib/api-client";

/** Chaves alteradas localmente há pouco tempo não são sobrescritas pelo polling/refetch */
const PENDING_TTL_MS = 60_000;

export function useStoreSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<Record<string, { value: string; ts: number }>>({});

  const fetchSettings = useCallback(async () => {
    try {
      const data = await settingsApi.fetchAll();
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s) => { map[s.key] = s.value; });

        // Protege alterações locais recentes contra respostas antigas do servidor
        const now = Date.now();
        for (const [key, pending] of Object.entries(pendingRef.current)) {
          if (now - pending.ts > PENDING_TTL_MS) {
            delete pendingRef.current[key];
            continue;
          }
          if (map[key] === pending.value) {
            delete pendingRef.current[key];
          } else {
            map[key] = pending.value;
          }
        }

        setSettings((prev) => {
          const prevKeys = Object.keys(prev);
          const sameLength = prevKeys.length === Object.keys(map).length;
          if (sameLength && prevKeys.every((k) => prev[k] === map[k])) return prev;
          return map;
        });
      }
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar configurações:", err);
      setError("Não foi possível carregar as configurações.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();

    const unsub = realtimeApi.subscribeToTable("store_settings", () => fetchSettings());
    return () => unsub();
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: string) => {
    pendingRef.current[key] = { value, ts: Date.now() };
    setSettings((prev) => ({ ...prev, [key]: value }));
    const { error } = await settingsApi.update(key, value);
    if (error) {
      delete pendingRef.current[key];
    } else {
      pendingRef.current[key] = { value, ts: Date.now() };
    }
    return { error };
  };

  return { settings, loading, error, updateSetting, refetch: fetchSettings };
}
