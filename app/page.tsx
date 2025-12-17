import WorkSection from "./components/work-section";
import Bio from "@/content/bio.mdx";
import Contact from "@/content/contact.mdx";
import { Header } from "./components/header";
import { Footer } from "./components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-14 pb-25 flex flex-col gap-6">
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

      <Footer />
    </div>
  );
}
