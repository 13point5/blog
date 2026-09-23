"use client";

import { useState } from "react";
import { BinderClip } from "./motifs";

export function PinnedNote() {
  const [pinned, setPinned] = useState(true);

  return (
    <div className={pinned ? "pin-note is-pinned" : "pin-note"}>
      <button
        type="button"
        className="pin-clip"
        aria-pressed={pinned}
        aria-controls="personal-note"
        onClick={() => setPinned((open) => !open)}
      >
        <BinderClip />
        <span className="pin-label">{pinned ? "Unpin" : "Pin"}</span>
      </button>
      <p id="personal-note" className="pin-slip" hidden={!pinned}>
        I also like Hogwarts, anime, and K-dramas.
      </p>
    </div>
  );
}
