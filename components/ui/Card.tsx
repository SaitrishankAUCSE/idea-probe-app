"use client";

/**
 * ============================================
 * CARD COMPONENT — Glass-morphism container
 * ============================================
 *
 * WHAT THIS DOES:
 * A versatile container with the frosted-glass aesthetic that defines IdeaProbe.
 * Used for validation results, competitor cards, pricing tiers, and more.
 *
 * DESIGN DECISIONS:
 * 1. **Glass by default** — the `.glass` utility from globals.css gives us
 *    `backdrop-filter: blur(16px)` + a semi-transparent dark background.
 *    This lets background gradients and colors bleed through subtly.
 *
 * 2. **Optional hover lift** — `hover:translateY(-2px)` paired with an
 *    enhanced shadow creates a "card rising off the page" effect.
 *    Only enabled via the `hover` prop to avoid unexpected layout shifts.
 *
 * 3. **Optional glow** — `animate-pulse-glow` adds a breathing glow border.
 *    Used sparingly for premium/featured items (e.g., the Pro pricing card).
 *
 * 4. **rounded-2xl** (16px radius) — modern SaaS standard. Larger radii
 *    feel more approachable and premium compared to sharp corners.
 *
 * WHY NOT A <div>?
 * This component adds zero logic — it's a styled wrapper. But extracting it
 * ensures EVERY card in the app shares identical glass/border/radius tokens.
 * Consistency > cleverness.
 */

import { cn } from "@/lib/utils";

/* ── Props ─────────────────────────────────── */

interface CardProps {
  children: React.ReactNode;
  /** Extra Tailwind classes for size, padding, etc. */
  className?: string;
  /** When true, card lifts up on hover with an enhanced shadow. */
  hover?: boolean;
  /** When true, card gets a breathing pulse-glow animation. */
  glow?: boolean;
}

/* ── Component ─────────────────────────────── */

export default function Card({
  children,
  className,
  hover = false,
  glow = false,
}: CardProps) {
  return (
    <div
      className={cn(
        /* ── Base glass effect ── */
        "glass rounded-2xl",

        /* ── Default padding — consumers can override via className ── */
        "p-6",

        /* ── Border ── */
        "border border-border",

        /* ── Smooth transition for hover effects ── */
        "transition-all duration-300 ease-out",

        /* ── Optional hover lift ──
         * translateY(-2px) moves the card UP (negative = up in CSS).
         * Combined with a larger shadow, this creates depth.
         * The border also lightens to reinforce the "lifted" state.
         */
        hover && [
          "hover:-translate-y-1",
          "hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
          "hover:border-border-hover",
        ].join(" "),

        /* ── Optional glow ──
         * `animate-pulse-glow` is defined in globals.css — a keyframe
         * that pulses box-shadow between 20px and 40px blur.
         */
        glow && "animate-pulse-glow",

        /* ── Consumer overrides ── */
        className
      )}
    >
      {children}
    </div>
  );
}
