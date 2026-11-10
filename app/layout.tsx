import type { Metadata } from "next";
// OpenDyslexic for dyslexia-friendly reading (selectable from the menu)
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/400-italic.css";
import "@fontsource/opendyslexic/700.css";
import "@fontsource/opendyslexic/700-italic.css";
import "./globals.css";
import { fontVariables } from "./fonts";
import { bootScript, fontCss, DEFAULT_BODY, DEFAULT_DISPLAY } from "@/lib/fonts-config";
import { ThemeProvider } from "./providers/theme-provider";
import { Header } from "./components/header";
import { Footer } from "./components/footer";

const description =
  "Applied Researcher on the post-training team at Chakra Labs. Building RL environments for foundation labs.";

export const metadata: Metadata = {
  title: {
    default: "sriraam",
    template: "%s | sriraam",
  },
  description,
  metadataBase: new URL("https://www.sriraam.me"),
  icons: {
    icon: "/zoro.png",
    shortcut: "/zoro.png",
    apple: "/zoro.png",
  },
  openGraph: {
    title: "sriraam",
    description,
    url: "https://www.sriraam.me",
    siteName: "sriraam",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "sriraam",
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={fontVariables}
      data-display={DEFAULT_DISPLAY}
      data-body={DEFAULT_BODY}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: fontCss() }} />
        <script dangerouslySetInnerHTML={{ __html: bootScript() }} />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <div className="relative isolate min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
