import { useEffect, useState } from "react";
import { api, newId } from "../services/api";
import { TEAM } from "../lib/constants";
import { useToast } from "../lib/toast";

const CADENCES = ["One-off", "Monthly", "Every 2 months", "Quarterly"];

const newPkg = () => ({
  id: newId(),
  name: "",
  price: "",
  cadence: "One-off",
  description: "",
  shopify_url: "",
  shopify_variant: "",
  active: true,
});

export function SettingsPanel({ settings, packages, onSaved }) {
  const toast = useToast();
  const [team, setTeam] = useState(settings.team);
  const [shop, setShop] = useState(settings.shop_domain);
  const [pkgs, setPkgs] = useState(packages.filter((p) => p.active));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  // Pick up changes made by someone else, unless this person has unsaved edits.
  useEffect(() => {
    if (!dirty) {
      setTeam(settings.team);
      setShop(settings.shop_domain);
      setPkgs(packages.filter((p) => p.active));
    }
  }, [settings, packages, dirty]);

  const edit = (fn) => {
    setDirty(true);
    fn();
  };
  const editPkg = (i, patch) => edit(() => setPkgs((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x))));

  async function save() {
    setBusy(true);
    const r = await api.saveSettings({ team, shop_domain: shop, packages: pkgs.filter((p) => p.name.trim()) });
    setBusy(false);
    if (!r.ok) toast(r.error || "That didn't save. Try again.");
    else {
      setDirty(false);
      toast("Settings saved");
      onSaved();
    }
  }

  return (
    <>
      <div className="stack">
        <h2>Team emails</h2>
        <p className="muted">Everyone listed here is emailed automatically when a new sign-up arrives.</p>
      </div>
      <div className="row">
        {TEAM.map(([k, n]) => (
          <div className="field" key={k}>
            <label htmlFor={`e-${k}`}>{n}</label>
            <input
              id={`e-${k}`}
              type="email"
              placeholder={`${k}@yourshop.com.au`}
              value={team[k] || ""}
              onChange={(e) => edit(() => setTeam((t) => ({ ...t, [k]: e.target.value.trim() })))}
            />
          </div>
        ))}
      </div>
      <div className="field">
        <label htmlFor="e-shop">Shopify store address</label>
        <input id="e-shop" placeholder="yourshop.myshopify.com" value={shop} onChange={(e) => edit(() => setShop(e.target.value))} />
        <span className="hint">Lets you link packages by variant ID instead of pasting a full product link.</span>
      </div>

      <div className="sep" />
      <div className="stack">
        <h2>Packages</h2>
        <p className="muted">
          Customers pick one of these on the sign-up form. Add the Shopify product link (or variant ID) so they can subscribe and pay
          through your store.
        </p>
      </div>
      <div className="stack" style={{ gap: 10 }}>
        {pkgs.length === 0 && (
          <div className="empty">No packages yet. Add one, for example a hospital-bag bundle or a monthly newborn box.</div>
        )}
        {pkgs.map((p, i) => (
          <div className="pkgedit" key={p.id}>
            <div className="row">
              <div className="field">
                <label htmlFor={`pn-${p.id}`}>Package name</label>
                <input id={`pn-${p.id}`} value={p.name} placeholder="Newborn essentials box" onChange={(e) => editPkg(i, { name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor={`pp-${p.id}`}>Price</label>
                <input id={`pp-${p.id}`} value={p.price} placeholder="$89 / month" onChange={(e) => editPkg(i, { price: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor={`pc-${p.id}`}>How often</label>
                <select id={`pc-${p.id}`} value={p.cadence} onChange={(e) => editPkg(i, { cadence: e.target.value })}>
                  {CADENCES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`pv-${p.id}`}>
                  Shopify variant ID <span className="muted">(optional)</span>
                </label>
                <input
                  id={`pv-${p.id}`}
                  inputMode="numeric"
                  value={p.shopify_variant}
                  placeholder="44123456789012"
                  onChange={(e) => editPkg(i, { shopify_variant: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor={`pu-${p.id}`}>Shopify product link</label>
              <input
                id={`pu-${p.id}`}
                value={p.shopify_url}
                placeholder="https://yourshop.com.au/products/newborn-box"
                onChange={(e) => editPkg(i, { shopify_url: e.target.value })}
              />
              <span className="hint">Use the product page if it offers a subscription option. Otherwise the variant ID builds a cart link.</span>
            </div>
            <div className="field">
              <label htmlFor={`pd-${p.id}`}>Short description</label>
              <input
                id={`pd-${p.id}`}
                value={p.description}
                placeholder="Nappies, wipes, swaddles and a feeding starter kit"
                onChange={(e) => editPkg(i, { description: e.target.value })}
              />
            </div>
            <div>
              <button className="btn ghost small" type="button" onClick={() => edit(() => setPkgs((list) => list.filter((_, j) => j !== i)))}>
                Remove package
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="toolbar">
        <button className="btn ghost small" type="button" onClick={() => edit(() => setPkgs((p) => [...p, newPkg()]))}>
          Add a package
        </button>
        <button className="btn" type="button" onClick={save} disabled={busy}>
          {busy ? "Saving…" : dirty ? "Save settings" : "Saved"}
        </button>
      </div>
    </>
  );
}
