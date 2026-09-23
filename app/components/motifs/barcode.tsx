/** Quiet technical barcode stripe — pencil-label / Swiss product cue. */
export function Barcode({ className = "" }: { className?: string }) {
  const bars = [1.2, 0.7, 1.6, 0.7, 0.7, 1.4, 0.7, 2, 0.7, 1.1, 0.7, 0.7, 1.8, 0.7, 1.3, 0.7, 0.9];
  let x = 0;
  return (
    <svg
      className={className}
      width="88"
      height="16"
      viewBox="0 0 88 16"
      aria-hidden="true"
      focusable="false"
    >
      {bars.map((w, i) => {
        const el = (
          <rect
            key={i}
            x={x}
            y="1"
            width={w}
            height="11"
            fill="currentColor"
            opacity={i % 2 === 0 ? 0.9 : 0}
          />
        );
        x += w + 0.55;
        return el;
      })}
      <text
        x="0"
        y="15.5"
        fill="currentColor"
        fontSize="3.2"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        letterSpacing="0.6"
        opacity="0.55"
      >
        13·5
      </text>
    </svg>
  );
}
