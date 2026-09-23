type IconProps = React.SVGProps<SVGSVGElement>;

/** Feather quill, used as the book-cover colophon emblem. */
export function QuillIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path
        d="M26.5 3.5C17 5 10.5 11.5 8.2 21.8l2.1.6c.8-2 1.8-3.8 3-5.4l3.3.3-2.1-1.8c.9-1 1.9-1.9 3-2.7l3.4.1-2.2-1.5c2.7-1.8 5.3-4.1 7.8-7.9Z"
        fill="currentColor"
      />
      <path
        d="M9.3 21.9 5 28.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Fountain pen with a split nib, drawn diagonally. */
export function FountainPenIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" {...props}>
      <g transform="rotate(45 60 60)">
        {/* cap end + barrel */}
        <rect x="52" y="-6" width="16" height="22" rx="7" fill="#1d1c1a" />
        <rect x="51" y="14" width="18" height="4" fill="#d9a441" />
        <rect x="51" y="18" width="18" height="46" rx="3" fill="#3d5fc4" />
        <rect x="55" y="20" width="3" height="42" rx="1.5" fill="#fff" opacity=".3" />
        {/* grip section */}
        <path d="M52 64h16l-2 14H54l-2-14Z" fill="#1d1c1a" />
        {/* nib */}
        <path d="M54 78h12l-3.6 22L60 108l-2.4-8L54 78Z" fill="#d9a441" />
        <path d="M60 86v17" stroke="#1d1c1a" strokeWidth="1.2" />
        <circle cx="60" cy="86" r="1.7" fill="#1d1c1a" />
      </g>
    </svg>
  );
}
