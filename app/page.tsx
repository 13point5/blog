import Link from "next/link";
import WorkSection from "./components/work-section";
import Bio from "@/content/bio.mdx";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-25 flex flex-col">
      {/* Hero Section */}
      <section className="animate-fade-blur">
        <Bio />
      </section>

      {/* Blog Section */}
      <WorkSection />

      {/* Play Section */}
      <section id="play" className="animate-fade-blur animation-delay-200">
        <h2 className="text-2xl font-semibold text-foreground mb-4 mt-10">play</h2>
        <Link href="/stitch" className="block group">
          <div className="flex items-baseline justify-between gap-4 py-2">
            <h3 className="font-medium group-hover:text-foreground-muted transition-colors">
              stitch
            </h3>
            <span className="text-sm text-foreground-muted">
              turn any image into cross stitch
            </span>
          </div>
        </Link>
      </section>

      {/* Contact Section */}
      {/* <section id="contact" className="animate-fade-blur animation-delay-200">
        <Contact />
      </section> */}
    </main>
  );
}
