"use client";

import { useState } from "react";
import { Stepper, useAutoPlay } from "pasito";
import { Tweet } from "react-tweet";
import "pasito/styles.css";

const DEFAULT_HEIGHT = 400;

type TweetGalleryProps = {
  /** Comma-separated tweet IDs, e.g. "2008016280306249848,1628832338187636740" */
  ids: string;
  /** Width in px. Default 400. */
  width?: string;
  /** Height in px. Same everywhere by default. */
  height?: string;
};

export function TweetGallery({
  ids,
  width = "400",
  height = String(DEFAULT_HEIGHT),
}: TweetGalleryProps) {
  const tweetIds = ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const [active, setActive] = useState(0);

  const { filling, fillDuration } = useAutoPlay({
    count: tweetIds.length,
    active,
    onStepChange: setActive,
    stepDuration: 1000,
    loop: true,
  });

  const w = parseInt(width, 10) || 400;
  const h = parseInt(height, 10) || DEFAULT_HEIGHT;
  const containerStyle = { width: w, minWidth: w, minHeight: h };

  if (tweetIds.length === 0) return null;
  if (tweetIds.length === 1) {
    return (
      <div
        className="flex justify-center [&>div]:w-full [&>div]:max-w-full"
        style={containerStyle}
      >
        <Tweet id={tweetIds[0]} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0">
      <div
        className="flex justify-center [&>div]:w-full [&>div]:max-w-full"
        style={containerStyle}
      >
        <Tweet id={tweetIds[active]} />
      </div>
      <Stepper
        count={tweetIds.length}
        active={active}
        onStepClick={setActive}
        filling={filling}
        fillDuration={fillDuration}
        className="tweet-gallery-stepper"
      />
    </div>
  );
}
