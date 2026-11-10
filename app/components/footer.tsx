import Image from "next/image";
import { Socials } from "./socials";
import { Typewriter } from "./typewriter";

export function Footer() {
  return (
    <footer className="mt-10 border-t-[3px] border-frame bg-background-card">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* RPG dialogue box */}
        <figure className="px-window flex items-start gap-4 p-4 max-w-2xl w-full mx-auto">
          <Image
            src="/zoro.png"
            alt=""
            width={56}
            height={56}
            className="w-14 h-14 border-[3px] border-frame object-cover shrink-0"
          />
          <div className="min-w-0">
            <figcaption className="d-xs uppercase text-koi mb-1">Richard Feynman</figcaption>
            <blockquote className="d-sm min-h-[2.6em]">
              <Typewriter text="What I cannot create, I do not understand." speed={45} />
            </blockquote>
          </div>
        </figure>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Socials />
          <p className="d-xs text-foreground-muted">drawn one pixel at a time · no koi were harmed</p>
        </div>
      </div>
    </footer>
  );
}
