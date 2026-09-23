import Image from "next/image";
import WorkSection from "./components/work-section";
import {
  Barcode,
  BinderClip,
  Cassette,
  FloppyDisk,
  PencilChips,
  PlayTransport,
} from "./components/motifs";

export default function Home() {
  return (
    <main className="folio-home folio-width">
      <div className="folio-grain" aria-hidden="true" />
      <section className="intro-section" aria-labelledby="intro-title">
        <div className="intro-heading">
          <div className="intro-heading-text">
            <h1 id="intro-title">Hey, I’m Sriraam</h1>
            <div className="intro-motif-row" aria-hidden="true">
              <PencilChips className="motif-pencil-chips" />
              <Barcode className="motif-barcode" />
            </div>
          </div>
          <Image
            src="/images/avatar.jpg"
            width={1254}
            height={1254}
            alt="Portrait illustration of Sriraam"
            className="home-avatar"
            priority
            sizes="112px"
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
        <p className="intro-aside">
          I also like Hogwarts, anime, and K-dramas. If any of this resonates,{" "}
          <a href="https://x.com/27upon2">I’d love to talk.</a>
        </p>
      </section>
      <WorkSection />
      <aside className="motif-rail" aria-hidden="true">
        <BinderClip className="motif-clip" />
        <Cassette className="motif-cassette" />
        <PlayTransport className="motif-transport" />
        <FloppyDisk className="motif-floppy" />
      </aside>
    </main>
  );
}
