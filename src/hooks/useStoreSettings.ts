import { useState, useEffect, useCallback } from "react";
import { settingsApi, realtimeApi } from "@/lib/api-client";

export function useStoreSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const data = await settingsApi.fetchAll();
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s) => { map[s.key] = s.value; });
      setSettings(map);
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

  return { settings, loading, updateSetting, refetch: fetchSettings };
}
