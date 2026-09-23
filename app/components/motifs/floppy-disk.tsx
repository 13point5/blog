/** 3.5″ floppy silhouette — material/label layout only (no character art). */
export function FloppyDisk({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="42"
      viewBox="0 0 40 42"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="38" height="40" rx="2.5" fill="var(--rt-ink)" />
      <rect x="8" y="1" width="24" height="11" rx="1" fill="var(--rt-charcoal)" />
      <rect x="11" y="3" width="8" height="7" rx="0.6" fill="var(--rt-cream)" opacity="0.35" />
      <text
        x="31"
        y="9"
        fill="var(--rt-cream)"
        fontSize="4.5"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
        textAnchor="middle"
        opacity="0.85"
      >
        HD
      </text>
      <rect x="5" y="15" width="30" height="22" rx="1.2" fill="var(--rt-cream)" />
      <rect x="7" y="17" width="16" height="8" rx="0.5" fill="var(--rt-teal)" opacity="0.85" />
      <rect x="24" y="17" width="9" height="8" rx="0.5" fill="var(--rt-ink)" />
      <rect x="7" y="27" width="26" height="1" fill="var(--rt-ink)" opacity="0.15" />
      <rect x="7" y="30" width="18" height="1" fill="var(--rt-ink)" opacity="0.12" />
      <rect x="7" y="33" width="22" height="1" fill="var(--rt-ink)" opacity="0.1" />
    </svg>
  );
}
