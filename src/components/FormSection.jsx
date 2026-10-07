/**
 * One numbered step of the sign-up form, with its own heading,
 * so the form reads as a few short sections instead of one long list.
 */
export function FormSection({ step, title, hint, children }) {
  const id = `sec-${step}`;
  return (
    <section className="fsec" aria-labelledby={id}>
      <header className="fsec-head">
        <span className="fsec-num" aria-hidden="true">
          {step}
        </span>
        <div>
          <h3 id={id}>{title}</h3>
          {hint && <p className="hint">{hint}</p>}
        </div>
      </header>
      <div className="fsec-body">{children}</div>
    </section>
  );
}
