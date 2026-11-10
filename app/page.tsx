import Bio from "@/content/bio.mdx";
import WorkSection from "./components/work-section";
import { PixelScene } from "./components/pixel-scene";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-28 pb-8 flex flex-col gap-16">
      <section className="animate-fade-blur">
        <h1 className="d-xl mb-6">Hey, I&apos;m Sriraam.</h1>
        <Bio />
      </section>

      <WorkSection />

      {/* The one toy on the page */}
      <section className="animate-fade-blur animation-delay-200 flex flex-col items-center gap-3 pt-4">
        <PixelScene scene="koi-pond" interactive className="!w-44 rounded-sm" />
        <p className="text-xs text-foreground-muted">The koi are hungry. Tap the water.</p>
      </section>
    </div>
  );
}
