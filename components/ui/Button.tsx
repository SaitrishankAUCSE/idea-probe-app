"use client";

/**
 * ============================================
 * BUTTON COMPONENT — The workhorse CTA element
 * ============================================
 *
 * WHAT THIS DOES:
 * A polymorphic, accessible button with four visual variants and three sizes.
 * Every CTA in the app — from "Get Started" to "Delete Account" — uses this.
 *
 * DESIGN DECISIONS:
 * 1. **Variants** map to semantic intent:
 *    - primary  → the main action (gradient bg, glow on hover)
 *    - secondary → less important action (glass bg, outlined)
 *    - ghost    → navigation-style link button (transparent)
 *    - danger   → destructive actions (red bg)
 *
 * 2. **Loading state** replaces the children with a spinning Loader2 icon
 *    AND disables the button to prevent double-submits.
 *
 * 3. **focus-ring** class from globals.css gives a visible focus indicator
 *    for keyboard navigation (WCAG 2.1 compliance).
 *
 * 4. **Scale on hover** (scale(1.02)) gives tactile feedback without
 *    moving layout — much better UX than color change alone.
 *
 * WHY forwardRef ISN'T NEEDED HERE:
 * Buttons rarely need imperative handles in React 19. If you need
 * ref forwarding (e.g., for tooltip anchoring), wrap with forwardRef later.
 */

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Props ─────────────────────────────────── */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style — maps to intent (primary CTA, secondary, ghost, danger). */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Physical size — affects padding, font-size, border-radius. */
  size?: "sm" | "md" | "lg";
  /** When true, shows spinner and disables interaction. */
  loading?: boolean;
}

/* ── Variant Styles ────────────────────────── */

/**
 * WHY a lookup object instead of a switch?
 * It's more readable, composable, and TypeScript enforces exhaustiveness
 * if you add a new variant to the union type above.
 */
const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: [
    /* Gradient background from primary blue → accent purple */
    "gradient-primary text-white",
    /* Glow effect on hover — makes the button feel "alive" */
    "hover:shadow-[0_0_25px_rgba(19,106,183,0.4)]",
    /* Slightly brighter on hover via opacity trick */
    "hover:brightness-110",
  ].join(" "),

  secondary: [
    /* Glass morphism background — semi-transparent with blur */
    "glass text-foreground",
    /* Visible border that lightens on hover */
    "border border-border hover:border-border-hover",
    /* Subtle background shift on hover */
    "hover:bg-background-tertiary",
  ].join(" "),

  ghost: [
    /* Fully transparent — text only */
    "bg-transparent text-foreground-secondary",
    /* Soft background tint on hover so users know it's clickable */
    "hover:bg-white/5 hover:text-foreground",
  ].join(" "),

  danger: [
    /* Solid red background — screams "careful!" */
    "bg-danger text-white",
    /* Danger glow on hover */
    "hover:shadow-[0_0_20px_rgba(226,75,75,0.4)]",
    "hover:brightness-110",
  ].join(" "),
};

/* ── Size Styles ───────────────────────────── */

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3.5 text-base rounded-xl",
};

/* ── Component ─────────────────────────────── */

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  /** Combine disabled prop with loading — loading always disables. */
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        /* ── Base styles applied to EVERY button ── */
        "inline-flex items-center justify-center gap-2",
        "font-semibold",
        /* Smooth transitions for scale, shadow, color, and background */
        "transition-all duration-200 ease-out",
        /* Tactile scale-up on hover (only when enabled) */
        !isDisabled && "hover:scale-[1.02] active:scale-[0.98]",
        /* Cursor feedback */
        isDisabled && "opacity-50 cursor-not-allowed",
        /* Accessible focus ring from globals.css */
        "focus-ring",

        /* ── Variant + Size ── */
        variantStyles[variant],
        sizeStyles[size],

        /* ── Consumer overrides ── */
        className
      )}
      {...rest}
    >
      {/*
       * Loading spinner — uses Loader2 from lucide-react.
       * The `animate-spin` class is a built-in Tailwind utility.
       * We keep children visible but add the spinner so width doesn't jump.
       */}
      {loading && (
        <Loader2
          className="h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
