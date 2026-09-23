import WorkSection from "./components/work-section";
import { Cartridge } from "./components/cartridge";
import Bio from "@/content/bio.mdx";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
      <section className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 lg:gap-24 items-start">
        <div className="md:sticky md:top-28 w-full max-w-[16rem] sm:max-w-[20rem] md:max-w-[22rem] mx-auto md:mx-0 animate-drop-in">
          <Cartridge />
          <p className="kicker text-center mt-6">
            fig. 01 — poke the cartridge
          </p>
        </div>
        <div className="bio animate-fade-blur animation-delay-100 min-w-0">
          <Bio />
        </div>
      </section>

      <WorkSection />
    </div>
  );
}
