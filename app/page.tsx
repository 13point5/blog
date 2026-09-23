import Link from "next/link";
import WorkSection from "./components/work-section";
import { FloppyCard } from "./components/floppy-card";

const interests = [
  "Sample efficiency",
  "Continual learning",
  "Human simulation",
  "Mech interp + RL",
  "World models and neural RL envs",
  "Sycophancy and adaptive reasoning",
];

export default function Home() {
  return (
    <main className="desk-page">
      <section className="still">
        <FloppyCard />
        <div className="scrap">
          <svg className="scrap-clip" width="22" height="36" viewBox="0 0 22 36" aria-hidden="true">
            <path
              d="M7 14V7.2C7 4.8 8.8 3 11 3s4 1.8 4 4.2V22c0 2.6-2 4.6-4.4 4.6S6.2 24.6 6.2 22V12.4c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5v9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <rect x="4" y="13" width="14" height="6" rx="1.2" fill="currentColor" />
          </svg>
          <p className="hand">
            I&apos;m Sriraam, an Applied Researcher on the post-training team at{" "}
            <a href="https://www.chakra.dev/">Chakra Labs</a>. I build RL environments,
            training tasks, and internal benchmarks focusing on knowledge work for
            foundation labs.
          </p>
          <p className="hand">These are my research interests:</p>
          <ul className="dots">
            {interests.map((item, index) => (
              <li key={item}>
                <i aria-hidden="true" />
                <span className={index % 2 === 0 ? "ruled" : undefined}>{item}</span>
              </li>
            ))}
          </ul>
          <p className="hand">
            My time studying Learning Science at{" "}
            <a href="https://www.gse.harvard.edu/">Harvard</a> has made me see almost
            every problem as a learning problem. I draw inspiration from human learning
            for my Reinforcement Learning work.
          </p>
          <p className="hand">I like Hogwarts, Anime, and K-dramas.</p>
          <Link className="cassette-chip" href="https://x.com/27upon2">
            <svg className="cassette-body" viewBox="0 0 54 34" aria-hidden="true">
              <rect x="1" y="1" width="52" height="32" rx="4" fill="#f7f3e7" />
              <circle cx="16" cy="14" r="6" fill="#34447f" />
              <circle cx="38" cy="14" r="6" fill="#34447f" />
              <circle cx="16" cy="14" r="2" fill="#f7f3e7" />
              <circle cx="38" cy="14" r="2" fill="#f7f3e7" />
              <rect x="8" y="23" width="38" height="6" rx="1" fill="#34447f" />
            </svg>
            I&apos;d love to talk
          </Link>
        </div>
      </section>
      <WorkSection />
    </main>
  );
}
