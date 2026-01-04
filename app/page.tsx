import WorkSection from "./components/work-section";
import Bio from "@/content/bio.mdx";
import Contact from "@/content/contact.mdx";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-6 pt-14 pb-25 flex flex-col">
      {/* Hero Section */}
      <section className="animate-fade-blur">
        <Bio />
      </section>

      {/* Work Section with filters */}
      <WorkSection />

      {/* Contact Section */}
      <section id="contact" className="animate-fade-blur animation-delay-200">
        <Contact />
      </section>
    </main>
  );
}
