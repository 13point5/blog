import Link from "next/link";
import Bio from "@/content/bio.mdx";
import { inventory, player, quests } from "@/content/site";
import WorkSection from "./components/work-section";
import { PixelScene } from "./components/pixel-scene";
import { PixelWindow } from "./components/pixel-window";
import { PixelIcon } from "./components/pixel-icon";
import { Typewriter } from "./components/typewriter";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-22 pb-16 flex flex-col gap-12">
      {/* Hero */}
      <section className="animate-fade-blur grid gap-8 md:grid-cols-[1.25fr_1fr] items-start">
        <div>
          <p className="d-sm text-koi mb-2">&gt; player one, ready</p>
          <h1 className="d-2xl mb-5 min-h-[1.25em]">
            <Typewriter text="hey, i'm sriraam" />
          </h1>
          <Bio />
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/blog" className="px-btn px-btn-primary">read the blog</Link>
            <a href="https://x.com/27upon2" target="_blank" rel="noopener noreferrer" className="px-btn">
              say hi
            </a>
          </div>
        </div>
        <PixelWindow title="rainy-day.gif" icon={<PixelIcon name="leaf" size={2} />} className="md:mt-2">
          <PixelScene scene="rain-city" />
        </PixelWindow>
      </section>

      {/* Featured */}
      <Link
        href="/blog/gdpx"
        className="animate-fade-blur animation-delay-100 px-window px-card grid sm:grid-cols-[minmax(0,15rem)_1fr] items-stretch"
      >
        <div className="border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-frame">
          <PixelScene scene="gdpx" className="h-full object-cover" />
        </div>
        <div className="p-4 sm:p-5 flex flex-col justify-center gap-1.5">
          <p className="flex items-center gap-2 d-xs uppercase text-koi">
            <PixelIcon name="star" size={2} className="px-bob" /> new quest unlocked
          </p>
          <h2 className="d-lg">GDPx: the best model scores 12%</h2>
          <p className="text-foreground-muted text-[0.95em] leading-snug">
            SemiAnalysis&apos;s frontier benchmark, with Chakra as the data partner for legal. I led our
            side. Here&apos;s what building it taught me <span aria-hidden="true">▸</span>
          </p>
        </div>
      </Link>

      {/* Character sheet + pond */}
      <section className="animate-fade-blur animation-delay-200 grid gap-8 md:grid-cols-[1.25fr_1fr] items-start">
        <PixelWindow title="player.sav" icon={<PixelIcon name="scroll" size={2} />} bodyClassName="p-4 sm:p-5 flex flex-col gap-5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 m-0">
            {player.map(({ k, v }) => (
              <div key={k} className="contents">
                <dt className="d-xs uppercase !font-normal !text-foreground-muted !m-0 self-center">{k}</dt>
                <dd className="!m-0 !text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h2 className="d-md mb-2">quest log <span className="text-foreground-muted d-xs">· research interests</span></h2>
            <ul className="grid gap-1.5">
              {quests.map((q) => (
                <li key={q} className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="w-3 h-3 border-2 border-frame bg-background grid place-items-center shrink-0">
                    <span className="w-1 h-1 bg-koi" />
                  </span>
                  {q}
                </li>
              ))}
            </ul>
            <p className="text-foreground-muted text-[0.9em] mt-3">
              Working on any of these?{" "}
              <a href="https://x.com/27upon2" target="_blank" rel="noopener noreferrer" className="link-default">
                Join the party
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="d-md mb-2">inventory</h2>
            <ul className="flex flex-wrap gap-2.5">
              {inventory.map((item) => (
                <li key={item.label} className="flex items-center gap-2 border-[3px] border-frame bg-background px-2.5 py-1.5">
                  <PixelIcon name={item.icon} size={2} />
                  <span className="d-sm">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </PixelWindow>

        <div>
          <PixelWindow title="koi-pond.exe" icon={<PixelIcon name="koi" size={2} />}>
            <PixelScene scene="koi-pond" interactive />
          </PixelWindow>
          <p className="d-xs text-foreground-muted mt-3 text-center">click the water to feed the koi</p>
        </div>
      </section>

      <WorkSection />
    </div>
  );
}
