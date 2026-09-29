import type { Metadata } from "next";
import { headers } from "next/headers";
import { capability, documents, localEditing } from "./store";
import { WritingStudio } from "./writing-studio";
import "./writing-studio.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Writing studio",
  robots: { index: false, follow: false },
};
export default async function StudioPage() {
  const host = (await headers()).get("host") || "";
  const local =
    localEditing && /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);
  return (
    <WritingStudio
      initialDocuments={await documents()}
      token={local ? capability() : null}
    />
  );
}
