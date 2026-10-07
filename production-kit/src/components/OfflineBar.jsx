export function OfflineBar({ count, online, onSync }) {
  let text = "";
  const s = count === 1 ? " is" : "s are";
  if (!online && count)
    text = `You're offline. ${count} sign-up${s} saved on this device and will sync when you're back online.`;
  else if (!online) text = "You're offline. New sign-ups will be saved on this device and sync when you reconnect.";
  else if (count) text = `${count} sign-up${s} saved on this device, waiting to sync.`;
  if (!text) return null;
  return (
    <div className={`offline${online ? " ok" : ""}`} role="status">
      <span>{text}</span>
      {online && count > 0 && (
        <button className="btn small" type="button" onClick={onSync}>
          Sync now
        </button>
      )}
    </div>
  );
}
