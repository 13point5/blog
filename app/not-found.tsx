import Link from "next/link";
import { PixelScene } from "./components/pixel-scene";
import { PixelWindow } from "./components/pixel-window";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 pt-28 pb-16 text-center">
      <PixelWindow title="error-404.exe">
        <PixelScene scene="dungeon" />
      </PixelWindow>
      <h1 className="d-xl mt-8 mb-2">you wandered off the map</h1>
      <p className="text-foreground-muted mb-6">This page doesn&apos;t exist. Reward: 0.</p>
      <Link href="/" className="px-btn px-btn-primary">respawn at home</Link>
    </div>
  );
}
