"use client";

/**
 * ============================================
 * DIMENSION BAR — Horizontal scored metric bar
 * ============================================
 *
 * WHAT THIS DOES:
 * Displays one dimension of an idea's validation score as a horizontal
 * progress bar with an icon, label, score, and expandable analysis text.
 * Used in the validation results page (e.g., "Market Size: 8/10").
 *
 * DESIGN DECISIONS:
 * 1. **Gradient fill** — The bar's gradient shifts based on the score:
 *    - High scores (7+): primary → success (blue to green) — positive vibe
 *    - Low scores (<4):  primary → danger (blue to red) — warning vibe
 *    - Mid scores (4-6): primary → warning (blue to amber) — neutral
 *    This immediately communicates "how good" the score is.
 *
 * 2. **Animated fill** — The bar animates from 0% width to its target
 *    width on mount using the `animate-progress-fill` keyframe.
 *    Combined with `ease-out`, it decelerates at the end — feels physical.
 *
 * 3. **Expandable analysis** — The analysis text is truncated to 2 lines
 *    by default (via `line-clamp-2`). Clicking expands it. This keeps
 *    the card compact but still provides full context on demand.
 *
 * 4. **Icon slot** — Each dimension has a unique icon (passed as a
 *    LucideIcon component) to aid quick scanning of the results.
 *
 * WHY `LucideIcon` AS A PROP TYPE?
 * Lucide exports each icon as a React component. The `LucideIcon` type
 * from lucide-react represents any of these components, so we can
 * accept any icon without importing all of them here.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Props ─────────────────────────────────── */

interface DimensionBarProps {
  /** Display name of the dimension (e.g., "Market Size"). */
  label: string;
  /** Score from 0 to 10. */
  score: number;
  /** AI-generated analysis text explaining the score. */
  analysis: string;
  /** Lucide icon component to display before the label. */
  icon: LucideIcon;
}

/* ── Helpers ───────────────────────────────── */

/**
 * Returns the CSS gradient string for the progress bar fill
 * based on the score range.
 */
function getBarGradient(score: number): string {
  if (score >= 7) {
    /* High score: blue → green. "This dimension is strong!" */
    return "linear-gradient(90deg, var(--primary), var(--success))";
  }
  if (score >= 4) {
    /* Mid score: blue → amber. "Room for improvement." */
    return "linear-gradient(90deg, var(--primary), var(--warning))";
  }
  /* Low score: blue → red. "Major concern." */
  return "linear-gradient(90deg, var(--primary), var(--danger))";
}

/**
 * Returns the text color class for the score number,
 * matching the gradient end-color for visual consistency.
 */
function getScoreColor(score: number): string {
  if (score >= 7) return "text-success";
  if (score >= 4) return "text-warning";
  return "text-danger";
}

/* ── Component ─────────────────────────────── */

export function DimensionBar({
  label,
  score,
  analysis,
  icon: Icon,
}: DimensionBarProps) {
  /*
   * `expanded` controls whether the analysis text is fully visible.
   * Defaults to collapsed (2-line truncation).
   */
  const [expanded, setExpanded] = useState(false);

  /* Score as a percentage for the bar width (0-10 → 0-100%) */
  const percentage = (score / 10) * 100;

  return (
    <div className="space-y-2">
      {/* ── Header Row: Icon + Label + Score ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/*
           * Icon component — rendered dynamically from the `icon` prop.
           * Colored with foreground-secondary to avoid competing with the bar.
           */}
          <Icon className="h-4 w-4 text-foreground-secondary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">
            {label}
          </span>
        </div>

        {/* Score number — bold and colored to match the bar gradient */}
        <span className={cn("text-sm font-bold", getScoreColor(score))}>
          {score}/10
        </span>
      </div>

      {/* ── Progress Bar ── */}
      <div className="relative h-2.5 rounded-full bg-background-tertiary overflow-hidden">
        {/*
         * The filled portion of the bar.
         * - `width` is set as inline style based on the score percentage.
         * - `background` uses a gradient that shifts by score range.
         * - `animate-progress-fill` makes it grow from 0% on mount.
         *
         * WHY inline style for width?
         * Tailwind can't generate dynamic width classes at build time.
         * `w-[73%]` would require every possible value to be in the CSS.
         * Inline styles handle dynamic values correctly.
         */}
        <div
          className="absolute inset-y-0 left-0 rounded-full animate-progress-fill"
          style={{
            width: `${percentage}%`,
            background: getBarGradient(score),
          }}
        />
      </div>

      {/* ── Analysis Text (Expandable) ── */}
      {analysis && (
        <div>
          <p
            className={cn(
              "text-xs text-foreground-secondary leading-relaxed",
              "transition-all duration-300",
              /*
               * line-clamp-2 truncates to 2 lines with an ellipsis.
               * When expanded, we remove the clamp to show full text.
               */
              !expanded && "line-clamp-2"
            )}
          >
            {analysis}
          </p>

          {/*
           * Show expand/collapse button only if the analysis is long
           * enough to be truncated (rough heuristic: > 120 chars).
           */}
          {analysis.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-1 text-xs text-primary hover:text-primary-light transition-colors focus-ring"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
