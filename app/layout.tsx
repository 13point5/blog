import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";
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

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "13point5",
  description:
    "Founding Engineer at Decode. Building browsers, agents, and RL environments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${lora.variable} font-sans`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <div className="min-h-screen bg-background">
            <Header />
            {children}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
