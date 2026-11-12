import Bio from "@/content/bio.mdx";
import WorkSection from "./components/work-section";
import { HomeArt } from "./components/art";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-32 pb-8 flex flex-col gap-12">
      <section className="animate-fade-blur" data-toc="About">
        <h1 className="d-xl mb-6"><span data-perch="">Hey, I&apos;m Sriraam.</span></h1>
        <Bio />
      </section>

      {/* The one piece of art on the page, between the intro and the writing */}
      <HomeArt className="animate-fade-blur animation-delay-100" />

      <WorkSection />
    </div>
  );
}
