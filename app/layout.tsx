/* ============================================
   ROOT LAYOUT — app/layout.tsx
   ============================================
   
   🎓 TEACHING NOTES:
   
   This is the ROOT LAYOUT — the outermost wrapper for every page in your app.
   In Next.js App Router, layouts are PERSISTENT. When a user navigates from
   /pricing to /validate, this layout stays mounted. Only the {children} swap.
   
   This means:
   1. The Navbar doesn't flicker on page changes
   2. Auth state is preserved across navigation
   3. Fonts only load once
   
   KEY CONCEPTS:
   - `import { Inter } from "next/font/google"` → Next.js auto-optimizes Google Fonts
     It downloads the font at BUILD TIME, self-hosts it, and avoids layout shift.
   - `metadata` export → This sets <title> and <meta> tags for SEO
   - `AuthProvider` → Wraps the entire app so any page can call useAuth()
   ============================================ */

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/* --- Font Loading ---
   Next.js downloads these at build time and self-hosts them.
   No external requests at runtime = faster load, better privacy.
   
   The `variable` prop creates a CSS custom property:
   --font-inter → used in globals.css as the sans-serif font
   --font-jetbrains → used for code/mono text */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap", // Show fallback font immediately, swap when loaded
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

/* --- SEO Metadata ---
   This is equivalent to <title> and <meta name="description"> in HTML.
   Next.js automatically injects these into the <head>.
   
   Individual pages can OVERRIDE this by exporting their own `metadata`. */
export const metadata: Metadata = {
  title: {
    default: "IdeaProbe — Validate Before You Build",
    template: "%s | IdeaProbe", // Pages can set title: "Pricing" → "Pricing | IdeaProbe"
  },
  description:
    "AI-powered startup idea validator. Get competitors, market analysis, and risk assessment in 30 seconds. The brutally honest co-founder you never had.",
  keywords: [
    "startup validation",
    "idea validator",
    "market research",
    "competitor analysis",
    "startup tools",
    "AI business analysis",
  ],
  authors: [{ name: "IdeaProbe" }],
  openGraph: {
    title: "IdeaProbe — Validate Before You Build",
    description:
      "AI-powered startup idea validator. Get competitors, market analysis, and risk assessment in 30 seconds.",
    url: "https://ideaprobe.io",
    siteName: "IdeaProbe",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IdeaProbe — Validate Before You Build",
    description:
      "AI-powered startup idea validator. The brutally honest co-founder you never had.",
  },
};

/* --- Root Layout Component ---
   This renders the HTML skeleton. Every page is injected as {children}.
   
   The structure is:
   <html>
     <body>
       <AuthProvider>       ← Makes auth available everywhere
         <Navbar />         ← Shows on every page
         <main>{page}</main> ← The actual page content
         <Footer />         ← Shows on every page
       </AuthProvider>
     </body>
   </html> */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          {/* Navbar is OUTSIDE of <main> so it's always at the top */}
          <Navbar />
          
          {/* <main> is the content area — it grows to fill available space
              pt-16 adds padding-top to account for the fixed navbar height */}
          <main className="flex-1 pt-16">
            {children}
          </main>
          
          {/* Footer is always at the bottom, pushed down by flex-1 on main */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
