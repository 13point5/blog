import Image from "next/image";
import Link from "next/link";
import { getBlogPosts } from "./blog/utils";
import { WritingShelf } from "./components/writing-shelf";

export default function Home() {
  const posts = getBlogPosts().sort((a, b) => (Number(a.metadata.sample === "true") - Number(b.metadata.sample === "true")) || b.metadata.publishedAt.localeCompare(a.metadata.publishedAt));
  return (
    <div className="studio-width home-page">
      <section className="studio-hero" aria-labelledby="intro-title">
        <div className="hero-copy"><div className="eyebrow"><span className="status-dot" /> A RESEARCHER. A BUILDER. ALWAYS A LEARNER.</div>
          <h1 id="intro-title">Serious curiosity.<br /><em>A little play.</em></h1>
          <p className="hero-intro">Hey, I’m <strong>Sriraam.</strong> I work on teaching machines to learn, and keep learning from what makes us human.</p>
          <p className="hero-detail">Applied Researcher at <a href="https://www.chakra.dev/">Chakra Labs ↗</a><br />Learning science at Harvard. Many tabs still open.</p>
          <Link href="#writing" className="text-link">Explore the notebook <span>↓</span></Link>
        </div>
        <div className="portrait-composition"><span className="hello-note">oh, hello!</span><div className="portrait-paper"><Image src="/avatar.jpeg" alt="Illustrated portrait of Sriraam with wavy black hair and a blue shirt" width={1254} height={1254} priority sizes="(max-width: 700px) 230px, 290px" /><div className="portrait-caption"><span>SRIRAAM / IN PROGRESS</span><span>☺</span></div></div><span className="portrait-star" aria-hidden="true">✳</span><span className="portrait-sticker">HUMAN<br />AFTER ALL.</span><div className="pencil pencil-blue" aria-hidden="true" /><div className="pencil pencil-red" aria-hidden="true" /></div>
      </section>
      <div className="interest-strip"><span>CURRENT ORBITS</span><p>Reinforcement learning <i>✳</i> Human learning <i>✳</i> Small experiments</p><span className="strip-end">( always evolving )</span></div>
      <section id="writing" className="writing-section" aria-labelledby="writing-title"><div className="section-heading"><div><div className="eyebrow">THE NOTEBOOK / 01—04</div><h2 id="writing-title">Thinking out loud<span>.</span></h2></div><Link className="text-link" href="/blog">All writing ↗</Link></div><p className="section-intro">Experiments, rabbit holes, and things I’m figuring out.</p><WritingShelf posts={posts.map(({ slug, metadata }) => ({ slug, metadata }))} /></section>
      <section className="about-strip"><span className="about-scribble" aria-hidden="true">↳</span><div><h2>A little more human.</h2><p>I see almost every problem as a learning problem. Away from the experiments: Hogwarts, anime, K-dramas, and following my curiosity somewhere new.</p></div><a href="https://x.com/27upon2" className="text-link">Let’s talk ↗</a></section>
    </div>
  );
}
