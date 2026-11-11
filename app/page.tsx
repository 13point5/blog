import Bio from "@/content/bio.mdx";
import WorkSection from "./components/work-section";
import { Art, WhenArt } from "./components/art";

const hint = <p className="text-xs text-foreground-muted text-center mt-2">The koi are hungry. Tap the water.</p>;

export default function Home() {
  return (
    <div className="relative max-w-2xl mx-auto px-5 pt-28 pb-8 flex flex-col gap-14">
      <section className="animate-fade-blur">
        <h1 className="d-xl mb-6">Hey, I&apos;m Sriraam.</h1>
        <Bio />
      </section>

      {/* Full-screen art: the courtyard runs edge to edge between the two sections */}
      <WhenArt width="full">
        <aside className="animate-fade-blur animation-delay-100 -my-4">
          <Art scene="koi-pond" interactive maxPx={380} />
          {hint}
        </aside>
      </WhenArt>

      <WorkSection />

      {/* Column art: in the margin beside the intro on wide screens, after the list otherwise */}
      <WhenArt width="column">
        <aside className="animate-fade-blur animation-delay-200 mx-auto w-64 xl:absolute xl:left-full xl:top-29 xl:ml-10">
          <Art scene="koi-pond" interactive />
          {hint}
        </aside>
      </WhenArt>
    </div>
  );
}
