"use client";

/**
 * ============================================
 * NAVBAR — Sticky glass navigation bar
 * ============================================
 *
 * WHAT THIS DOES:
 * The primary navigation for IdeaProbe. It handles two states:
 * - **Unauthenticated**: shows Pricing, Log In, Sign Up
 * - **Authenticated**: shows Validate, History, Dashboard, Sign Out
 *
 * DESIGN DECISIONS:
 * 1. **Glassmorphism + scroll opacity** — The navbar starts semi-transparent,
 *    then becomes MORE opaque as the user scrolls. This is a premium touch
 *    used by Apple, Linear, and Vercel. We track scroll position with
 *    `useEffect` + a scroll listener and adjust the backdrop opacity.
 *
 * 2. **Active route indicator** — A small underline with `bg-primary` marks
 *    the current page. We detect this with `usePathname()` from Next.js.
 *
 * 3. **Mobile menu** — A hamburger icon (Menu) toggles a slide-down panel.
 *    The panel uses `animate-slide-down` from our design system.
 *    The X icon closes it. We also close on route change.
 *
 * 4. **Sticky positioning** — `fixed top-0` keeps the nav always visible.
 *    `z-50` ensures it floats above all page content.
 *
 * 5. **Logo** — Radar icon + "IdeaProbe" text. The radar icon fits the
 *    "scanning/validation" metaphor of the product.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────── */

interface NavLink {
  href: string;
  label: string;
}

/* ── Link Configs ──────────────────────────── */

/** Links shown when the user is NOT signed in. */
const publicLinks: NavLink[] = [
  { href: "/pricing", label: "Pricing" },
];

/** Links shown when the user IS signed in. */
const authLinks: NavLink[] = [
  { href: "/validate", label: "Validate" },
  { href: "/history", label: "History" },
  { href: "/dashboard", label: "Dashboard" },
];

/* ── Component ─────────────────────────────── */

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  /* ── Scroll-based opacity ──
   * We increase the navbar background opacity as the user scrolls.
   * At scrollY=0, the glass is very transparent (0.5).
   * At scrollY≥100, the glass is nearly opaque (0.95).
   * This creates the "materializing on scroll" effect.
   */
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    /* Fire once on mount in case the page loads mid-scroll */
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ── Mobile menu toggle ── */
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* ── Choose which links to render ── */
  const links = user ? authLinks : publicLinks;

  /** Check if a link is the active route. */
  const isActive = (href: string) => pathname === href;

  return (
    <header
      className={cn(
        /* ── Fixed positioning ── */
        "fixed top-0 left-0 right-0 z-50",
        /* ── Glass background ──
         * The transition between transparent and opaque happens via
         * the scrolled state toggling these classes.
         */
        "backdrop-blur-xl border-b transition-all duration-300",
        scrolled
          ? "bg-background/90 border-border shadow-lg shadow-black/10"
          : "bg-background/50 border-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2 group focus-ring"
        >
          {/*
           * The Radar icon rotates subtly on hover via group-hover.
           * This reinforces the "scanning" brand metaphor.
           */}
          <Radar className="h-7 w-7 text-primary transition-transform duration-500 group-hover:rotate-90" />
          <span className="text-lg font-bold gradient-text">
            IdeaProbe
          </span>
        </Link>

        {/* ── Desktop Links ──
         * Hidden on mobile (hidden md:flex), shown on medium+ screens.
         */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-3 py-2 text-sm font-medium rounded-lg",
                "transition-colors duration-200 focus-ring",
                isActive(link.href)
                  ? "text-foreground"
                  : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
              )}
            >
              {link.label}
              {/*
               * Active indicator — a small line below the text.
               * Uses absolute positioning so it doesn't affect layout.
               * The width animates via scale-x for a smooth appearance.
               */}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full animate-scale-in" />
              )}
            </Link>
          ))}

          {/* ── Auth Actions ── */}
          {!loading && (
            <div className="flex items-center gap-2 ml-4">
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="primary" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Mobile Hamburger ──
         * Only visible on small screens (md:hidden).
         * Toggles between Menu and X icons.
         */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-white/5 transition-colors focus-ring"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {/* ── Mobile Menu Panel ──
       * Slides down from the navbar when `mobileOpen` is true.
       * Uses `animate-slide-down` for a smooth entrance.
       * The glass background keeps the premium feel.
       */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-border animate-slide-down">
          <div className="flex flex-col gap-1 px-4 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive(link.href)
                    ? "text-foreground bg-primary/10"
                    : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* ── Mobile Auth Actions ── */}
            {!loading && (
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border">
                {user ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="justify-start gap-1.5"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                      >
                        Log In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
