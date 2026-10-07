import { useCallback, useEffect, useState } from "react";
import { IS_DEMO } from "../config";
import { api } from "../services/api";

/**
 * Sign-ups are saved on this device first if there's no internet,
 * then sent to the server once the device is back online.
 * Each sign-up has its own id from the device, and the server ignores an id it
 * has already received, so re-sending after a dropped connection never duplicates.
 */
// Demo and production keep separate queues, so test sign-ups can never reach the real database.
const KEY = IS_DEMO ? "due-date-signups-queue-demo" : "due-date-signups-queue";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function save(q) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
    return true;
  } catch {
    return false;
  }
}

const listeners = new Set();
const changed = () => listeners.forEach((fn) => fn());

/** "ok" = arrived, "denied" = the server refused it (bad details), "retry" = no connection or server busy. */
async function send(lead) {
  if (!navigator.onLine) return "retry";
  const r = await api.signup(lead);
  if (r.ok) return "ok";
  if (r.network || r.status >= 500 || r.status === 429) return "retry";
  return "denied";
}

/** Send now, or keep on this device. Resolves to "sent", "saved", "denied" or "failed". */
export async function submitLead(lead) {
  const r = await send(lead);
  if (r === "ok") return { result: "sent" };
  if (r === "denied") return { result: "denied" };
  const q = load();
  q.push({ ...lead, saved_offline: true });
  if (!save(q)) return { result: "failed" };
  changed();
  return { result: "saved" };
}

let syncing = false;
export async function syncQueue() {
  if (syncing || !navigator.onLine) return 0;
  const q = load();
  if (!q.length) return 0;
  syncing = true;
  let sent = 0;
  const keep = [];
  for (const lead of q) {
    const r = await send(lead);
    if (r === "ok") sent++;
    else if (r === "retry") keep.push(lead);
    // "denied" items are dropped: the server will never accept them as they are.
  }
  save(keep);
  syncing = false;
  changed();
  return sent;
}

/** Live count of unsent sign-ups plus online status, with automatic syncing. */
export function useOfflineQueue(onSynced) {
  const [count, setCount] = useState(() => load().length);
  const [online, setOnline] = useState(() => navigator.onLine);

  const sync = useCallback(async () => {
    const n = await syncQueue();
    if (n && onSynced) onSynced(n);
    return n;
  }, [onSynced]);

  useEffect(() => {
    const refresh = () => {
      setCount(load().length);
      setOnline(navigator.onLine);
    };
    listeners.add(refresh);
    const goOnline = () => {
      refresh();
      sync();
    };
    const onVisible = () => {
      if (!document.hidden) sync();
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", refresh);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => {
      if (load().length) sync();
    }, 30000);
    sync();
    return () => {
      listeners.delete(refresh);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [sync]);

  return { count, online, sync };
}
