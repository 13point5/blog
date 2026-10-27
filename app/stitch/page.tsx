import { StitchStudio } from "./stitch-studio";

export const metadata = {
  title: "Stitch",
  description: "Turn any image into a cross stitch, down to the twist in the floss.",
};

export default function StitchPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-16">
      <section className="animate-fade-blur">
        <h1 className="text-2xl font-semibold mb-2 mt-6 text-foreground">stitch</h1>
        <p className="text-foreground-muted max-w-2xl">
          Pick a pattern or bring your own image and it gets charted onto aida
          cloth: matched to real DMC floss, stitched with two twisted strands,
          bottom legs first so every top leg lies the same way. Hover to look
          closely at the thread.
        </p>
        <StitchStudio />
      </section>
    </main>
  );
}
