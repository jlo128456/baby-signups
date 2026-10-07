import { useEffect, useId, useRef, useState } from "react";
import { STATES, searchAddresses } from "../services/addressLookup";

/**
 * Postal address with suggestions as you type.
 *
 * - Type into "Street address": matching Australian addresses appear underneath.
 *   Pick one and the suburb, state and postcode fill in by themselves.
 * - Phones can also fill the whole address from saved details (autocomplete attributes).
 * - Every box can still be typed or corrected by hand, and it all works offline.
 *
 * value:    { address_line1, address_line2, suburb, state, postcode }
 * onChange: (patch) => void   e.g. onChange({ suburb: "Logan" })
 */
export function AddressField({ value, onChange }) {
  const listId = useId();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const typed = useRef(false); // only search when the person types, not when we fill the box
  const boxRef = useRef(null);

  // Search a moment after typing stops, cancelling any older search.
  useEffect(() => {
    if (!typed.current) return undefined;
    const text = value.address_line1;
    if (text.trim().length < 4) {
      setItems([]);
      setOpen(false);
      setSearching(false);
      return undefined;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      const found = await searchAddresses(text, ctrl.signal);
      if (!ctrl.signal.aborted) {
        setItems(found);
        setOpen(found.length > 0);
        setActive(-1);
        setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
      setSearching(false); // a newer keystroke takes over; never leave the spinner stuck
    };
  }, [value.address_line1]);

  // Close the list when tapping elsewhere.
  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function pick(a) {
    typed.current = false;
    onChange({
      address_line1: a.line1,
      suburb: a.suburb || value.suburb,
      state: a.state || value.state,
      postcode: a.postcode || value.postcode,
    });
    setOpen(false);
    setItems([]);
  }

  function onKeyDown(e) {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <fieldset className="address">
      <legend className="sr-only">Postal address</legend>

      <div className="field addr-search" ref={boxRef}>
        <label htmlFor="f-addr1">Street address</label>
        <div className="addr-input">
          <svg className="addr-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" />
          </svg>
          <input
            id="f-addr1"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="address-line1"
            placeholder="e.g. 12 Queen Street"
            value={value.address_line1}
            onChange={(e) => {
              typed.current = true;
              onChange({ address_line1: e.target.value });
            }}
            onKeyDown={onKeyDown}
            onFocus={() => items.length && setOpen(true)}
          />
          {searching && <span className="addr-spinner" aria-hidden="true" />}
        </div>
        {open && (
          <ul className="addr-list" id={listId} role="listbox" aria-label="Matching addresses">
            {items.map((a, i) => (
              <li
                key={a.label}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? "active" : undefined}
                onPointerDown={(e) => {
                  e.preventDefault(); // keep focus, so the tap selects instead of closing the list
                  pick(a);
                }}
              >
                <b>{a.line1 || a.suburb}</b>
                <span>
                  {[a.line1 ? a.suburb : "", [a.state, a.postcode].filter(Boolean).join(" ")]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </li>
            ))}
            <li className="addr-foot" aria-hidden="true">
              Can't see it? Keep typing, or fill in the boxes below.
            </li>
          </ul>
        )}
      </div>

      <div className="field">
        <label htmlFor="f-addr2">
          Unit, building or PO Box <span className="muted">(optional)</span>
        </label>
        <input
          id="f-addr2"
          autoComplete="address-line2"
          placeholder="e.g. Unit 4"
          value={value.address_line2}
          onChange={(e) => onChange({ address_line2: e.target.value })}
        />
      </div>

      <div className="addr-row">
        <div className="field addr-suburb">
          <label htmlFor="f-suburb">Suburb</label>
          <input
            id="f-suburb"
            autoComplete="address-level2"
            value={value.suburb}
            onChange={(e) => onChange({ suburb: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="f-state">State</label>
          <select
            id="f-state"
            autoComplete="address-level1"
            value={value.state}
            onChange={(e) => onChange({ state: e.target.value })}
          >
            <option value="">Choose</option>
            {STATES.map(([code]) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-post">Postcode</label>
          <input
            id="f-post"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="4000"
            value={value.postcode}
            onChange={(e) => onChange({ postcode: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          />
        </div>
      </div>
    </fieldset>
  );
}
