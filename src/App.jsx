import { useCallback, useEffect, useState } from "react";
import { api } from "./services/api";
import { useTeamData } from "./hooks/useTeamData";
import { DemoBanner } from "./components/DemoBanner";
import { Header } from "./components/Header";
import { SignupForm } from "./components/SignupForm";
import { TeamDesk } from "./components/TeamDesk";
import { SettingsPanel } from "./components/SettingsPanel";
import { Login } from "./components/Login";
import { TabBar } from "./components/TabBar";

export default function App() {
  const [staff, setStaff] = useState(null);
  const isStaff = !!staff;
  const [tab, setTab] = useState(() => (window.location.hash === "#team" ? "login" : "form"));
  const [packages, setPackages] = useState([]);
  const team = useTeamData(isStaff);

  const loadPackages = useCallback(async () => {
    const r = await api.packages();
    if (r.ok) setPackages(r.data.packages);
  }, []);

  // On start: load packages and check whether a team member is already signed in (saved in local storage).
  useEffect(() => {
    loadPackages();
    api.me().then((r) => {
      if (r.ok && r.data.staff) {
        setStaff(r.data.staff);
        setTab((t) => (t === "login" || t === "form" ? "desk" : t));
      }
    });
  }, [loadPackages]);

  // Switching tabs starts at the top of the page (important on a phone).
  const goTo = (key) => {
    setTab(key);
    window.scrollTo({ top: 0 });
  };

  const signedIn = (s) => {
    setStaff(s);
    goTo("desk");
    loadPackages();
  };

  const signOut = async () => {
    await api.logout();
    setStaff(null);
    goTo("form");
    loadPackages();
  };

  const reloadAll = useCallback(() => {
    team.reload();
    loadPackages();
  }, [team.reload, loadPackages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Body class lets the CSS make room for the phone tab bar.
  useEffect(() => {
    document.body.classList.toggle("has-tabbar", isStaff);
    return () => document.body.classList.remove("has-tabbar");
  }, [isStaff]);

  const toContact = team.leads.filter((l) => l.status === "new").length;

  return (
    <div className={`wrap${isStaff ? " staff" : ""}`}>
      <DemoBanner signedIn={isStaff} onTryTeam={() => goTo("login")} />

      <Header staff={staff} tab={tab} onTab={goTo} onSignOut={signOut} />

      <section className="panel">
        {tab === "login" && !isStaff && <Login onSignedIn={signedIn} onCancel={() => goTo("form")} />}
        {tab === "form" && <SignupForm packages={packages} isStaff={isStaff} onSaved={team.reload} />}
        {tab === "desk" && isStaff && (
          <TeamDesk
            leads={team.leads}
            upsells={team.upsells}
            packages={packages}
            settings={team.settings}
            loading={team.loading}
            error={team.error}
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
