import Bio from "@/content/bio.mdx";
import WorkSection from "./components/work-section";
import { PixelScene } from "./components/pixel-scene";

export default function Home() {
  return (
    <div className="relative max-w-2xl mx-auto px-5 pt-28 pb-8 flex flex-col gap-16">
      <section className="animate-fade-blur">
        <h1 className="d-xl mb-6">Hey, I&apos;m Sriraam.</h1>
        <Bio />
      </section>

      <WorkSection />

      {/* The one toy on the page: a pond that dissolves into the margin.
          It sits beside the intro on wide screens and after the list otherwise. */}
      <aside className="animate-fade-blur animation-delay-200 flex flex-col items-center gap-1 xl:absolute xl:left-full xl:top-24 xl:ml-2 xl:w-80">
        <PixelScene scene="koi-pond" interactive className="art-round !w-64 xl:!w-80" />
        <p className="text-xs text-foreground-muted">The koi are hungry. Tap the water.</p>
      </aside>
    </div>
  );
}
