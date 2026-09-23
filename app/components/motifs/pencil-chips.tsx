/** Swiss pencil color chips — palette cue from the hex-pencil product ref. */
export function PencilChips({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="72"
      height="14"
      viewBox="0 0 72 14"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="2" width="10" height="10" rx="1" fill="var(--rt-green)" />
      <rect x="12" y="2" width="10" height="10" rx="1" fill="var(--rt-cream-deep)" stroke="var(--rt-ink)" strokeWidth="0.6" />
      <rect x="24" y="2" width="10" height="10" rx="1" fill="var(--rt-sky)" />
      <rect x="36" y="2" width="10" height="10" rx="1" fill="var(--rt-mustard)" />
      <rect x="48" y="2" width="10" height="10" rx="1" fill="var(--rt-ink)" />
      <rect x="60" y="2" width="10" height="10" rx="1" fill="var(--rt-teal)" />
    </svg>
  );
}
