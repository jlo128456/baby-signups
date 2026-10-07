import { useCallback, useEffect, useRef, useState } from "react";
import { IS_DEMO } from "./config";
import { api } from "./services/api";
import { useOfflineQueue } from "./hooks/useOfflineQueue";
import { useTeamData } from "./hooks/useTeamData";
import { useToast } from "./lib/toast";
import { DemoBanner } from "./components/DemoBanner";
import { Header } from "./components/Header";
import { OfflineBar } from "./components/OfflineBar";
import { SignupForm } from "./components/SignupForm";
import { TeamDesk } from "./components/TeamDesk";
import { SettingsPanel } from "./components/SettingsPanel";
import { Login } from "./components/Login";
import { TabBar } from "./components/TabBar";

const PKG_CACHE = IS_DEMO ? "due-date-signups-packages-demo" : "due-date-signups-packages";

export default function App() {
  const toast = useToast();
  const [staff, setStaff] = useState(null);
  const isStaff = !!staff;
  const [tab, setTab] = useState(() => (window.location.hash === "#team" ? "login" : "form"));
  const [packages, setPackages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PKG_CACHE) || "[]");
    } catch {
      return [];
    }
  });

  const onSynced = useCallback((n) => toast(`Synced ${n} sign-up${n === 1 ? "" : "s"} to the office`), [toast]);
  const queue = useOfflineQueue(onSynced);
  const team = useTeamData(isStaff);

  // When saved sign-ups finish syncing, refresh the team desk so they appear straight away.
  const lastCount = useRef(queue.count);
  useEffect(() => {
    if (isStaff && queue.count < lastCount.current) team.reload();
    lastCount.current = queue.count;
  }, [queue.count, isStaff]); // eslint-disable-line react-hooks/exhaustive-deps

  // Packages are kept on the device too, so the form still shows them offline.
  const loadPackages = useCallback(async () => {
    const r = await api.packages();
    if (r.ok) {
      setPackages(r.data.packages);
      try {
        localStorage.setItem(PKG_CACHE, JSON.stringify(r.data.packages));
      } catch {
        /* storage unavailable */
      }
    }
  }, []);

  // On start: load packages and check whether a team member is already signed in on this device.
  useEffect(() => {
    loadPackages();
    api.me().then((r) => {
      if (r.ok && r.data.staff) {
        setStaff(r.data.staff);
        setTab((t) => (t === "login" || t === "form" ? "desk" : t));
      }
    });
  }, [loadPackages]);

  const signedIn = (s) => {
    setStaff(s);
    setTab("desk");
    loadPackages(); // the team also sees removed packages, so old enquiries keep their names
  };

  const signOut = async () => {
    await api.logout();
    setStaff(null);
    setTab("form");
    loadPackages();
  };

  const reloadAll = useCallback(() => {
    team.reload();
    loadPackages();
  }, [team.reload, loadPackages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switching tabs starts at the top of the page (important on a phone).
  const goTo = (key) => {
    setTab(key);
    window.scrollTo({ top: 0 });
  };

  // Body class lets the CSS make room for the phone tab bar.
  useEffect(() => {
    document.body.classList.toggle("has-tabbar", isStaff);
    return () => document.body.classList.remove("has-tabbar");
  }, [isStaff]);

  const toContact = team.leads.filter((l) => l.status === "new").length;

  const syncNow = async () => {
    const n = await queue.sync();
    if (!n) toast(queue.online ? "Couldn't sync yet. Try again shortly" : "Still offline. Connect to Wi-Fi and try again");
  };

  return (
    <div className={`wrap${isStaff ? " staff" : ""}`}>
      {IS_DEMO && <DemoBanner signedIn={isStaff} onTryTeam={() => goTo("login")} />}

      <Header staff={staff} tab={tab} onTab={goTo} onSignOut={signOut} />

      <section className="panel">
        <OfflineBar count={queue.count} online={queue.online} onSync={syncNow} />

        {tab === "login" && !isStaff && <Login onSignedIn={signedIn} onCancel={() => goTo("form")} />}
        {tab === "form" && <SignupForm packages={packages} isStaff={isStaff} />}
        {tab === "desk" && isStaff && (
          <TeamDesk
            leads={team.leads}
            upsells={team.upsells}
            packages={packages}
            settings={team.settings}
            loading={team.loading}
            error={team.error}
            queued={queue.count}
            onChanged={reloadAll}
          />
        )}
        {tab === "settings" && isStaff && <SettingsPanel settings={team.settings} packages={packages} onSaved={reloadAll} />}
      </section>

      {!isStaff && tab === "form" && (
        <p className="footer-link">
          <button className="btn link" type="button" onClick={() => goTo("login")}>
            Team sign in
          </button>
        </p>
      )}

      {isStaff && <TabBar tab={tab} onTab={goTo} placement="bottom" badge={{ desk: toContact }} />}
    </div>
  );
}
