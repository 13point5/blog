/** Minimal binder-clip silhouette from the scrapbook moodboard. */
export function BinderClip({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="28"
      viewBox="0 0 18 28"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 11.5V5.2C5 3.2 6.6 1.5 8.7 1.5h.6C11.4 1.5 13 3.2 13 5.2V18.5c0 2.3-1.8 4.2-4 4.2s-4-1.9-4-4.2V9.8c0-1.3 1-2.3 2.2-2.3s2.2 1 2.2 2.3v8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="3.2" y="10" width="11.6" height="5.2" rx="1.1" fill="currentColor" opacity="0.92" />
    </svg>
  );
}
