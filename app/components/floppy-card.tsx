import Image from "next/image";

export function FloppyCard() {
  return (
    <article className="floppy" aria-label="Sriraam">
      <span className="floppy-notch" aria-hidden="true" />
      <div className="floppy-shutter" aria-hidden="true">
        <span className="floppy-mark" />
        <span className="floppy-window" />
      </div>
      <div className="floppy-label">
        <div className="floppy-photo">
          <Image
            src="/images/avatar.jpg"
            alt="Portrait illustration of Sriraam"
            width={1254}
            height={1254}
            priority
            sizes="420px"
          />
          <span className="floppy-scan" aria-hidden="true" />
        </div>
        <div className="floppy-copy">
          <p className="floppy-kicker">Applied researcher · Chakra Labs</p>
          <h1 className="floppy-name">sriraam</h1>
          <div className="floppy-meta">
            <p className="floppy-index">13.5</p>
            <svg width="86" height="28" viewBox="0 0 86 28" aria-hidden="true">
              <rect x="0" y="0" width="1.4" height="16" fill="#111" />
              <rect x="3" y="0" width="2.2" height="16" fill="#111" />
              <rect x="7" y="0" width="1" height="16" fill="#111" />
              <rect x="10" y="0" width="3" height="16" fill="#111" />
              <rect x="15" y="0" width="1.2" height="16" fill="#111" />
              <rect x="18.4" y="0" width="2" height="16" fill="#111" />
              <rect x="22" y="0" width="1" height="16" fill="#111" />
              <rect x="25" y="0" width="2.6" height="16" fill="#111" />
              <rect x="30" y="0" width="1.1" height="16" fill="#111" />
              <text x="0" y="26" fill="#111" fontSize="7" fontFamily="ui-monospace, monospace">
                RL ENV
              </text>
            </svg>
          </div>
        </div>
      </div>
    </article>
  );
}
