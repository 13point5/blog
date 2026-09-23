import Image from "next/image";
import WorkSection from "./components/work-section";
import { FloppyDisk } from "./components/motifs";
import { PinnedNote } from "./components/pinned-note";

export default function Home() {
  return (
    <main className="folio-home folio-width">
      <div className="folio-grain" aria-hidden="true" />
      <div className="margin-floppy" aria-hidden="true">
        <FloppyDisk />
      </div>
      <section className="intro-section" aria-labelledby="intro-title">
        <div className="intro-heading">
          <h1 id="intro-title">Hey, I’m Sriraam</h1>
          <Image
            src="/images/avatar.jpg"
            width={1254}
            height={1254}
            alt="Portrait illustration of Sriraam"
            className="home-avatar"
            priority
            sizes="88px"
          />
        </div>
        <p>
          I’m an Applied Researcher on the post-training team at{" "}
          <a href="https://www.chakra.dev/">Chakra Labs</a>. I build RL
          environments, training tasks, and internal benchmarks for foundation
          labs.
        </p>
        <p>
          My interests include sample efficiency, continual learning, human
          simulation, mechanistic interpretability + RL, world models and neural
          RL environments, sycophancy, and adaptive reasoning.
        </p>
        <p>
          Studying Learning Science at{" "}
          <a href="https://www.gse.harvard.edu/">Harvard</a> made me see almost
          every problem as a learning problem. I draw inspiration from human
          learning for my work in reinforcement learning.
        </p>
        <PinnedNote />
      </section>
      <WorkSection />
    </main>
  );
}
