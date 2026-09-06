import type { Metadata } from "next";
import { Geist, EB_Garamond, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./providers/theme-provider";
import { Header } from "./components/header";
import { Footer } from "./components/footer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-display", style: ["normal", "italic"], display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-reading", style: ["normal", "italic"], display: "swap" });

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
      className={`${geist.variable} ${garamond.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
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
          <div className="site-shell min-h-screen flex flex-col">
            <a className="skip-link" href="#main-content">Skip to content</a>
            <Header />
            <div className="flex-1" id="main-content">{children}</div>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
