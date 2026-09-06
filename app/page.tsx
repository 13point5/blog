import Image from "next/image";
import WorkSection from "./components/work-section";

export default function Home() {
  return (
    <main className="folio-home folio-width">
      <section className="intro-section" aria-labelledby="intro-title">
        <div className="intro-heading">
          <h1 id="intro-title">Hey, I’m Sriraam</h1>
          <Image src="/images/folio/learning-sketch.webp" width={1024} height={1024}
            alt="A small ink sketch of an open book and an iron flywheel."
            className="ink-sketch home-sketch" priority sizes="150px" />
        </div>
        <p>I’m an Applied Researcher on the post-training team at <a href="https://www.chakra.dev/">Chakra Labs</a>. I build RL environments, training tasks, and internal benchmarks for foundation labs.</p>
        <p>My interests include sample efficiency, continual learning, human simulation, mechanistic interpretability + RL, world models and neural RL environments, sycophancy, and adaptive reasoning.</p>
        <p>Studying Learning Science at <a href="https://www.gse.harvard.edu/">Harvard</a> made me see almost every problem as a learning problem. I draw inspiration from human learning for my work in reinforcement learning.</p>
        <p className="intro-aside">I also like Hogwarts, anime, and K-dramas. If any of this resonates, <a href="https://x.com/27upon2">I’d love to talk.</a></p>
      </section>
      <WorkSection />
    </main>
  );
}
