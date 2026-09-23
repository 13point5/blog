import type { Metadata, Viewport } from "next";
import { Archivo, Caveat, Doto, JetBrains_Mono, Newsreader } from "next/font/google";
// OpenDyslexic font for dyslexia-friendly reading - all weights and styles
import "@fontsource/opendyslexic/400.css"; // Regular
import "@fontsource/opendyslexic/400-italic.css"; // Regular Italic
import "@fontsource/opendyslexic/700.css"; // Bold
import "@fontsource/opendyslexic/700-italic.css"; // Bold Italic
import "./globals.css";
import { ThemeProvider } from "./providers/theme-provider";
import { Header } from "./components/header";
import { Footer } from "./components/footer";

// Archivo: UI + printed-object labels (its width axis gives the chunky
// expanded look of pencil / floppy branding)
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

// Newsreader: long-form reading, vintage book feel
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

// Doto: dot-matrix section titles (tape deck display)
const doto = Doto({
  subsets: ["latin"],
  axes: ["ROND"],
  variable: "--font-doto",
  preload: false,
});

// Caveat: handwritten scribbles on labels and signatures
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  preload: false,
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8e5df" },
    { media: "(prefers-color-scheme: dark)", color: "#121211" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "sriraam",
    template: "%s | sriraam",
  },
  description:
    "Applied Researcher on the post-training team at Chakra Labs. Building RL environments for foundation labs.",
  metadataBase: new URL("https://www.sriraam.me"),
  openGraph: {
    title: "sriraam",
    description:
      "Applied Researcher on the post-training team at Chakra Labs. Building RL environments for foundation labs.",
    url: "https://www.sriraam.me",
    siteName: "sriraam",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "sriraam",
    description:
      "Applied Researcher on the post-training team at Chakra Labs. Building RL environments for foundation labs.",
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
      className={`${archivo.variable} ${newsreader.variable} ${jetbrainsMono.variable} ${doto.variable} ${caveat.variable} font-sans`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  const fontFamily = localStorage.getItem('fontFamily') || 'sans';
                  const root = document.documentElement;

                  // Apply theme
                  root.classList.remove('dark', 'warm');
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  }

                  // Apply font (remove all font classes first)
                  root.classList.remove('font-sans', 'font-dyslexia');
                  if (fontFamily === 'dyslexia') {
                    root.classList.add('font-dyslexia');
                  } else {
                    root.classList.add('font-sans');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
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
          <a href="#main" className="skip-link">
            skip to content
          </a>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
