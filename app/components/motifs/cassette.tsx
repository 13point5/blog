/** Navy cassette card motif — Teenage-Engineering-adjacent, not a clone. */
export function Cassette({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="56"
      height="36"
      viewBox="0 0 56 36"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="54" height="34" rx="3" fill="var(--rt-navy)" />
      <rect x="8" y="7" width="12" height="12" rx="6" fill="var(--rt-cream)" opacity="0.92" />
      <rect x="36" y="7" width="12" height="12" rx="6" fill="var(--rt-cream)" opacity="0.92" />
      <circle cx="14" cy="13" r="2.2" fill="var(--rt-navy)" />
      <circle cx="42" cy="13" r="2.2" fill="var(--rt-navy)" />
      <rect x="22" y="10" width="12" height="6" rx="1" fill="var(--rt-cream)" opacity="0.55" />
      <rect x="10" y="24" width="36" height="7" rx="1.2" fill="var(--rt-cream)" opacity="0.88" />
      <rect x="12" y="26" width="5" height="3" rx="0.4" fill="var(--rt-ink)" />
      <rect x="19" y="26.5" width="24" height="0.8" fill="var(--rt-ink)" opacity="0.25" />
      <rect x="19" y="28.5" width="16" height="0.8" fill="var(--rt-ink)" opacity="0.18" />
    </svg>
  );
}
