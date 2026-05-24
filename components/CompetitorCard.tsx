"use client";

/**
 * ============================================
 * COMPETITOR CARD — Displays a competing product
 * ============================================
 *
 * WHAT THIS DOES:
 * Shows details of a competitor identified during validation:
 * - Company name with an external link icon
 * - Clickable URL (opens in a new tab)
 * - Description of what the competitor does
 * - Threat level badge (high / medium / low)
 *
 * DESIGN DECISIONS:
 * 1. **Left border accent** — A colored left border immediately
 *    communicates the threat level at a glance:
 *    - Red (high) → "this competitor is a major threat"
 *    - Amber (medium) → "some overlap but differentiable"
 *    - Green (low) → "different enough, low risk"
 *    This is the same pattern used by GitHub issues and Jira cards.
 *
 * 2. **Hover lift** — The glass card lifts on hover to show interactivity.
 *    Combined with the border-hover transition, it feels tactile.
 *
 * 3. **External link icon** — Next to the company name, a small arrow icon
 *    signals "this opens in a new tab". UX convention from Google, etc.
 *
 * 4. **Badge for threat level** — Uses our Badge component with the
 *    matching variant (danger/warning/success) for consistency.
 *
 * WHY NOT JUST A TABLE?
 * Cards are more scannable than table rows for this kind of data.
 * Each competitor is a "unit" with its own context (description).
 * Tables would lose the visual hierarchy and make descriptions cramped.
 */

import { ExternalLink } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/* ── Props ─────────────────────────────────── */

interface CompetitorCardProps {
  /** Company or product name. */
  name: string;
  /** The competitor's website URL. */
  url: string;
  /** Brief description of what the competitor does. */
  description: string;
  /** How much of a threat this competitor poses. */
  threatLevel: "high" | "medium" | "low";
}

/* ── Threat Level Config ───────────────────── */

/**
 * Maps threat levels to:
 * - `border`: left border color class
 * - `badge`: Badge variant for the threat label
 * - `label`: Human-readable text for the badge
 */
const threatConfig: Record<
  CompetitorCardProps["threatLevel"],
  { border: string; badge: "danger" | "warning" | "success"; label: string }
> = {
  high: {
    border: "border-l-danger",
    badge: "danger",
    label: "High Threat",
  },
  medium: {
    border: "border-l-warning",
    badge: "warning",
    label: "Medium Threat",
  },
  low: {
    border: "border-l-success",
    badge: "success",
    label: "Low Threat",
  },
};

/* ── Component ─────────────────────────────── */

export function CompetitorCard({
  name,
  url,
  description,
  threatLevel,
}: CompetitorCardProps) {
  const config = threatConfig[threatLevel];

  return (
    <div
      className={cn(
        /* ── Glass background ── */
        "glass rounded-2xl p-5",
        /* ── Left border accent ──
         * `border-l-4` creates a thick left border.
         * The color is set by the threat level config.
         */
        "border-l-4",
        config.border,
        /* ── Hover effects ── */
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1",
        "hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
        "hover:border-border-hover"
      )}
    >
      {/* ── Header: Name + Badge ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-foreground">
          {name}
        </h3>
        <Badge variant={config.badge} className="flex-shrink-0">
          {config.label}
        </Badge>
      </div>

      {/* ── URL Link ──
       * Opens in a new tab with `target="_blank"`.
       * `rel="noopener noreferrer"` prevents the new page from
       * accessing window.opener (security best practice).
       */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-light transition-colors focus-ring mb-3"
      >
        {/*
         * Truncate long URLs to prevent layout breakage.
         * `max-w-[200px]` + `truncate` handles this gracefully.
         */}
        <span className="truncate max-w-[200px]">{url}</span>
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>

      {/* ── Description ── */}
      <p className="text-sm text-foreground-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}
