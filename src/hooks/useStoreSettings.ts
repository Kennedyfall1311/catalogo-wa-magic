import { useState, useEffect, useCallback } from "react";
import { settingsApi, realtimeApi } from "@/lib/api-client";

export function useStoreSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await settingsApi.fetchAll();
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s) => { map[s.key] = s.value; });
        setSettings(map);
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
    const { error } = await settingsApi.update(key, value);
    if (!error) setSettings((prev) => ({ ...prev, [key]: value }));
    return { error };
  };

  return { settings, loading, error, updateSetting, refetch: fetchSettings };
}
