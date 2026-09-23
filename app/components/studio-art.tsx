/** Original, code-drawn objects inspired by the tactile reference board. */
export function StudioArt({ kind = "disk", label = "LEARNING, BY DOING", number = "01" }: { kind?: string; label?: string; number?: string }) {
  if (kind === "tape") return (
    <div className="object-stage stage-blue" aria-hidden="true">
      <div className="cassette"><i className="screw screw-a" /><i className="screw screw-b" />
        <div className="tape-label"><span>A / FIELD RECORDINGS</span><strong>{label}</strong><div className="reels"><i /><b /><i /></div></div>
        <div className="tape-bottom"><span>◦</span><span>60</span><span>◦</span></div>
      </div><span className="object-caption">SIDE A · A WORK IN PROGRESS</span>
    </div>
  );
  if (kind === "paper") return (
    <div className="object-stage stage-pink" aria-hidden="true"><div className="paper-note"><span>THINGS WORTH NOTICING</span><div className="paper-flower">✳</div><strong>{label}</strong><div className="paper-rule" /><small>take your time. / {number}</small></div><span className="object-caption">COLLECTED ALONG THE WAY</span></div>
  );
  return (
    <div className={`object-stage ${kind === "disk-green" ? "stage-green" : "stage-yellow"}`} aria-hidden="true">
      <div className={`floppy ${kind === "disk-green" ? "floppy-green" : ""}`}><div className="disk-shutter"><span>HD</span><i /></div><div className="disk-label"><span>SR / EXPERIMENT NO. {number}</span><div className="disk-art"><i /><i /><i /></div><strong>{label}</strong><small>IDEAS ARE MEANT TO BE PLAYED WITH.</small></div><div className="disk-foot"><i /><span>3.5″ / KEEP EXPLORING</span><i /></div></div><span className="object-caption">SMALL EXPERIMENTS, BIG QUESTIONS</span>
    </div>
  );
}
