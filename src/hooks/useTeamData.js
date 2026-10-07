import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

/**
 * Loads everything the team desk needs, and refreshes every 20 seconds
 * (and whenever the app comes back to the screen) so changes made by
 * Amanda, Laura or Richard on other devices show up.
 */
export function useTeamData(enabled) {
  const [leads, setLeads] = useState([]);
  const [upsells, setUpsells] = useState([]);
  const [settings, setSettings] = useState({ team: {}, shop_domain: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const [l, s] = await Promise.all([api.leads(), api.settings()]);
    if (l.ok) {
      setLeads(l.data.leads);
      setUpsells(l.data.upsells);
      setError("");
    } else if (!l.network) {
      setError(l.error);
    }
    if (s.ok) setSettings({ team: s.data.team || {}, shop_domain: s.data.shop_domain || "" });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    reload();
    const timer = window.setInterval(() => {
      if (!document.hidden) reload();
    }, 20000);
    const onVisible = () => {
      if (!document.hidden) reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, reload]);

  return { leads, upsells, settings, loading, error, reload };
}
