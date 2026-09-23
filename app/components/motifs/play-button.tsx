/** Charcoal transport + orange play accent from the cassette UI ref. */
export function PlayTransport({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="64"
      height="18"
      viewBox="0 0 64 18"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="1" width="16" height="16" rx="2.5" fill="var(--rt-charcoal)" />
      <polygon points="5,5 5,13 3,9" fill="var(--rt-cream)" opacity="0.85" />
      <polygon points="9,5 9,13 7,9" fill="var(--rt-cream)" opacity="0.85" />
      <rect x="22" y="1" width="16" height="16" rx="2.5" fill="var(--rt-charcoal)" />
      <rect x="26.5" y="5.5" width="7" height="7" rx="0.8" fill="var(--rt-cream)" opacity="0.85" />
      <rect x="44" y="1" width="16" height="16" rx="2.5" fill="var(--rt-play)" />
      <polygon points="49.5,5 49.5,13 57,9" fill="var(--rt-cream)" />
    </svg>
  );
}
