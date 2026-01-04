import type { Metadata } from "next";
import { Geist } from "next/font/google";
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
      className={`${geist.variable} font-sans`}
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
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else if (theme === 'warm') {
                    root.classList.add('warm');
                  }
                  
                  // Apply font (remove all font classes first)
                  root.classList.remove('font-sans', 'font-dyslexia');
                  root.classList.add('font-' + fontFamily);
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
