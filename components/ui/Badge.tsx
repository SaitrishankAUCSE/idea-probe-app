"use client";

/**
 * ============================================
 * BADGE COMPONENT — Tiny status/label pills
 * ============================================
 *
 * WHAT THIS DOES:
 * Small pill-shaped labels used to tag plans (Free/Pro), threat levels,
 * score categories, and general statuses throughout the app.
 *
 * DESIGN DECISIONS:
 * 1. **Pill shape** — `rounded-full` creates the capsule look that's
 *    universally recognized as a "tag" or "badge" in modern UI.
 *
 * 2. **Variant-based coloring** — each variant maps to a specific semantic
 *    meaning so the color language is consistent across the entire app:
 *    - free    → muted/neutral (it's the default, nothing special)
 *    - pro     → gradient (premium, eye-catching)
 *    - popular → accent purple with glow (limited-time, featured)
 *    - success/danger/warning → status indicators
 *
 * 3. **Small padding** — `px-2.5 py-0.5` keeps badges compact so they
 *    sit comfortably inline with text or card headers.
 *
 * WHY NOT JUST A <span>?
 * Consistency. Every badge in the app must use the same border-radius,
 * padding, font-size, and color mapping. This component enforces that.
 */

import { cn } from "@/lib/utils";

/* ── Props ─────────────────────────────────── */

interface BadgeProps {
  /** The semantic style of the badge. */
  variant?: "free" | "pro" | "popular" | "success" | "danger" | "warning";
  children: React.ReactNode;
  /** Extra classes for positioning, margins, etc. */
  className?: string;
}

/* ── Variant Styles ────────────────────────── */

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  /**
   * Free — neutral and understated. Uses foreground-tertiary at 20% opacity
   * so it doesn't compete with pro/popular badges for attention.
   */
  free: "bg-foreground-tertiary/20 text-foreground-secondary",

  /**
   * Pro — the money badge. Uses the brand gradient (primary→accent)
   * to reinforce that this is the premium tier.
   */
  pro: "gradient-primary text-white",

  /**
   * Popular — accent purple with a subtle glow to draw the eye.
   * Used on the pricing card that most users should pick.
   */
  popular: "bg-accent text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]",

  /** Success — green for "good", "passed", "high score". */
  success: "bg-success/15 text-success",

  /** Danger — red for "risk", "failed", "low score". */
  danger: "bg-danger/15 text-danger",

  /** Warning — amber for "caution", "medium score". */
  warning: "bg-warning/15 text-warning",
};

/* ── Component ─────────────────────────────── */

export default function Badge({
  variant = "free",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        /* ── Shape ── */
        "inline-flex items-center rounded-full",
        /* ── Compact padding ── */
        "px-2.5 py-0.5",
        /* ── Typography ── */
        "text-xs font-semibold",
        /* ── Smooth transitions for dynamic variant swaps ── */
        "transition-colors duration-200",
        /* ── Variant colors ── */
        variantStyles[variant],
        /* ── Consumer overrides ── */
        className
      )}
    >
      {children}
    </span>
  );
}
