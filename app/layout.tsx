import type { Metadata } from "next";
import { Barlow_Condensed, Caveat, Geist, IBM_Plex_Mono } from "next/font/google";
// OpenDyslexic font for dyslexia-friendly reading - all weights and styles
import "@fontsource/opendyslexic/400.css"; // Regular
import "@fontsource/opendyslexic/400-italic.css"; // Regular Italic
import "@fontsource/opendyslexic/700.css"; // Bold
import "@fontsource/opendyslexic/700-italic.css"; // Bold Italic
import "./globals.css";
import { ThemeProvider } from "./providers/theme-provider";
import { Header } from "./components/header";
import { Footer } from "./components/footer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "800"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const hand = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-hand",
});

export const metadata: Metadata = {
  title: {
    default: "sriraam",
    template: "%s | sriraam",
  },
  description:
    "Applied Researcher on the post-training team at Chakra Labs. Building RL environments for foundation labs.",
  metadataBase: new URL("https://www.sriraam.me"),
  icons: {
    icon: "/zoro.png",
    shortcut: "/zoro.png",
    apple: "/zoro.png",
  },
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
      className={`${geist.variable} ${display.variable} ${mono.variable} ${hand.variable} font-sans`}
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
      <body className="desk-body antialiased">
        <ThemeProvider>
          <div className="desk-frame min-h-screen flex flex-col bg-background">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
