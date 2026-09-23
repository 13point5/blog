import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-16 flex flex-col items-center text-center">
      <div
        className="w-full max-w-sm aspect-[1.6] rounded-2xl border-2 border-dashed border-border-strong/40 grid place-items-center animate-fade-blur"
        aria-hidden="true"
      >
        <p className="font-dot font-black text-4xl sm:text-5xl leading-none">
          NO DISK
          <span className="animate-caret">_</span>
        </p>
      </div>
      <p className="kicker mt-8">error 404 · slot empty</p>
      <h1 className="font-serif italic text-3xl mt-3 text-balance">
        This page was never written to tape.
      </h1>
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        <Link href="/" className="key key-play">
          <ArrowLeft aria-hidden="true" />
          home
        </Link>
        <Link href="/blog" className="key">
          archive
        </Link>
      </div>
    </div>
  );
}
