"use client";

/**
 * ============================================
 * FOOTER — Site-wide footer
 * ============================================
 *
 * WHAT THIS DOES:
 * A clean, minimal footer that appears on every page. Contains:
 * - Brand identity (logo + tagline)
 * - Navigation links (Pricing, Login, Terms, Privacy)
 * - Copyright notice
 *
 * DESIGN DECISIONS:
 * 1. **bg-background-secondary** — slightly lighter than the page background,
 *    creating a natural visual boundary without needing a thick border.
 *
 * 2. **Subtle top border** — `border-t border-border` provides just enough
 *    separation from page content.
 *
 * 3. **Responsive layout** — stacks vertically on mobile (flex-col),
 *    goes horizontal on md+ (md:flex-row). The copyright stays centered
 *    on mobile and left-aligned on desktop.
 *
 * 4. **External-safe links** — all links use Next.js <Link> for client-side
 *    navigation. Terms and Privacy could be external URLs later.
 *
 * WHY "use client"?
 * Strictly, this footer could be a server component since it has no
 * interactivity. But the project rules require all components to be
 * client components for consistency, and the overhead is negligible.
 */

import Link from "next/link";
import { Radar } from "lucide-react";

/* ── Types ─────────────────────────────────── */

interface FooterLink {
  href: string;
  label: string;
}

/* ── Link Config ───────────────────────────── */

const footerLinks: FooterLink[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Login" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

/* ── Component ─────────────────────────────── */

export function Footer() {
  return (
    <footer className="bg-background-secondary border-t border-border mt-auto">
      {/*
       * mt-auto pushes the footer to the bottom of the page when content
       * is shorter than the viewport (works because <body> is flex-col
       * with min-h-screen in globals.css).
       */}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Top Row: Brand + Links ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* ── Brand ── */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link href="/" className="flex items-center gap-2 focus-ring">
              <Radar className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold gradient-text">
                IdeaProbe
              </span>
            </Link>
            <p className="text-sm text-foreground-tertiary">
              Validate before you build.
            </p>
          </div>

          {/* ── Navigation Links ── */}
          <nav
            className="flex flex-wrap items-center justify-center gap-6"
            aria-label="Footer navigation"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-foreground-secondary hover:text-foreground transition-colors duration-200 focus-ring"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Bottom Row: Copyright ──
         * Separated by a subtle border for visual hierarchy.
         */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-foreground-tertiary">
            &copy; {new Date().getFullYear()} IdeaProbe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
