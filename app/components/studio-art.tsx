type ArtProps = { kind?: string; label?: string; number?: string };

function Screw({ className = "" }: { className?: string }) {
  return <i className={`screw ${className}`} />;
}

/** Small physical objects, drawn with CSS. No card backgrounds or image requests. */
export function StudioArt({ kind = "disk", label = "VIBE RL", number = "01" }: ArtProps) {
  if (kind === "tape") {
    return (
      <div className="media-object cassette" aria-hidden="true">
        <Screw className="screw-tl" /><Screw className="screw-tr" />
        <Screw className="screw-bl" /><Screw className="screw-br" />
        <div className="cassette-label">
          <span className="tape-side">A</span><span className="tape-code">SR—{number} / 60 MIN</span>
          <strong>{label}</strong>
          <div className="tape-mechanism"><i className="reel" /><span className="tape-window" /><i className="reel" /></div>
          <div className="tape-stripes" />
        </div>
        <div className="cassette-base"><i /><span /><i /></div>
      </div>
    );
  }
  if (kind === "cartridge") {
    return (
      <div className="media-object cartridge" aria-hidden="true">
        <div className="cartridge-ridges" /><span className="cartridge-emboss">NOTEBOY</span>
        <div className="cartridge-label"><span>EXPERIMENT / {number}</span><div className="pixel-art"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><strong>{label}</strong><small>PRESS START</small></div>
        <div className="cartridge-bottom"><span>▼</span></div>
      </div>
    );
  }
  if (kind === "record") {
    return (
      <div className="media-object record-set" aria-hidden="true">
        <div className="vinyl"><div className="vinyl-label"><span>SIDE A</span><strong>33⅓</strong><i /></div></div>
        <div className="record-sleeve"><span>SRIRAAM / {number}</span><div className="sleeve-art"><i /><i /><i /><i /></div><strong>{label}</strong><small>NOTES ON PAYING ATTENTION</small></div>
      </div>
    );
  }
  if (kind === "book") {
    return (
      <div className="media-object book" aria-hidden="true"><div className="book-pages" /><div className="book-cover"><span>COLLECTED NOTES / {number}</span><strong>{label}</strong><div className="book-symbol"><i /><i /><i /></div><small>SRIRAAM</small></div><span className="book-ribbon" /></div>
    );
  }
  return (
    <div className={`media-object floppy ${kind === "disk-white" ? "floppy-white" : ""}`} aria-hidden="true">
      <span className="disk-arrow">↑</span><div className="disk-top"><div className="disk-shutter"><span>HD</span><i /></div></div>
      <div className="disk-label"><div className="disk-label-top"><span>SR—{number}</span><span>1.44 MB</span></div><strong>{label}</strong><div className="disk-label-art"><i /><i /><i /><i /><i /></div><small>EXPERIMENTS IN LEARNING</small></div>
      <div className="disk-foot"><i /><span>3.5″</span><i /></div>
    </div>
  );
}
