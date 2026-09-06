import Image from "next/image";
import WorkSection from "./components/work-section";
const interests = [
  ["I", "Sample efficiency", "Learning more from less experience."],
  ["II", "Continual learning", "Growing without starting over."],
  ["III", "Human simulation", "Models of the people behind the prompts."],
  ["IV", "Mechanistic interpretability + RL", "Looking inside the learning process."],
  ["V", "World models & neural environments", "Building worlds that teach."],
  ["VI", "Sycophancy & adaptive reasoning", "Knowing when to change your mind."],
];
export default function Home() {
  return <main className="folio-home folio-width">
    <section className="intro-section" aria-labelledby="intro-title"><div className="intro-copy">
      <p className="eyebrow">The notebooks of Sriraam Raja</p>
      <h1 id="intro-title">On learning.<br />And <em>learning<br className="desktop-break" /> machines.</em></h1>
      <p className="intro-bio">I’m Sriraam, an Applied Researcher on the post-training team at <a href="https://www.chakra.dev/">Chakra Labs</a>. I build RL environments, training tasks, and internal benchmarks for foundation labs.</p>
      <a className="text-link intro-invitation" href="https://x.com/27upon2">Let’s compare notes <span aria-hidden="true">↗</span></a>
    </div><figure className="hero-plate"><Image src="/images/folio/observatory.webp" width={1536} height={1024} alt="An ink drawing of a scholar’s observatory, with an open notebook and a mechanical model of a learning machine." className="engraving" priority sizes="(max-width: 700px) 90vw, 480px" /><figcaption><span>Fig. I</span> A small observatory for curious minds.</figcaption></figure></section>
    <section className="interests-section" aria-labelledby="interests-title">
      <div className="section-heading"><h2 id="interests-title">Lines of inquiry</h2><span className="eyebrow">Always a work in progress</span></div>
      <div className="interest-grid">{interests.map(([number, title, description]) => <div className="interest" key={number}><span className="roman">{number}.</span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div>
      <p className="learning-note">Studying Learning Science at <a href="https://www.gse.harvard.edu/">Harvard</a> made me see almost every problem as a learning problem. I draw inspiration from human learning for my work in reinforcement learning.</p>
    </section>
    <WorkSection />
    <aside className="personal-note"><span className="fleuron" aria-hidden="true">❦</span><p>Elsewhere in my mind: Hogwarts, anime, and K-dramas.<br /><em>A little wonder is good for the work.</em></p></aside>
  </main>;
}
