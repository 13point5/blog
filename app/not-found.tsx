import Link from "next/link";
import { PixelScene } from "./components/pixel-scene";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-32 pb-8">
      <h1 className="d-xl mb-3">You wandered off the map.</h1>
      <p className="text-foreground-muted mb-8">
        This page doesn&apos;t exist.{" "}
        <Link href="/" className="link-default">Head back home</Link>.
      </p>
      <PixelScene scene="dungeon" className="rounded-sm" />
    </div>
  );
}
