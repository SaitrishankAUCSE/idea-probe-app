"use client";

/**
 * ============================================
 * RISK CARD — Displays an identified risk
 * ============================================
 *
 * WHAT THIS DOES:
 * Shows a single risk identified during idea validation:
 * - Risk name with a severity badge
 * - Description of the risk
 * - Mitigation suggestion with a lightbulb icon
 *
 * DESIGN DECISIONS:
 * 1. **Left border by severity** — Same pattern as CompetitorCard.
 *    Consistent threat-level visual language across the app:
 *    - Red → High severity (requires immediate attention)
 *    - Amber → Medium severity (manageable concern)
 *    - Green → Low severity (minor consideration)
 *
 * 2. **AlertTriangle icon for high severity** — The universal "danger"
 *    icon next to the risk name for high-severity risks makes them
 *    impossible to miss during a quick scan.
 *
 * 3. **Mitigation section** — Every risk comes with a suggested
 *    mitigation strategy. The lightbulb icon (💡) signals "here's
 *    what you can do about it" — turning fear into action.
 *
 * 4. **Glass card** — Consistent with all other cards in the app.
 *    The glass effect keeps things premium even when showing bad news.
 *
 * WHY SEPARATE FROM CompetitorCard?
 * Risks and competitors share visual patterns (severity, left border)
 * but have different data shapes (URL vs. mitigation). Merging them
 * would create a "god component" with too many conditional branches.
 */

import { AlertTriangle, Lightbulb } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/* ── Props ─────────────────────────────────── */

interface RiskCardProps {
  /** Name/title of the risk. */
  name: string;
  /** How severe the risk is. */
  severity: "high" | "medium" | "low";
  /** Detailed description of the risk. */
  description: string;
  /** Suggested strategy to mitigate the risk. */
  mitigation: string;
}

/* ── Severity Config ───────────────────────── */

const severityConfig: Record<
  RiskCardProps["severity"],
  { border: string; badge: "danger" | "warning" | "success"; label: string }
> = {
  high: {
    border: "border-l-danger",
    badge: "danger",
    label: "High Risk",
  },
  medium: {
    border: "border-l-warning",
    badge: "warning",
    label: "Medium Risk",
  },
  low: {
    border: "border-l-success",
    badge: "success",
    label: "Low Risk",
  },
};

/* ── Component ─────────────────────────────── */

export function RiskCard({
  name,
  severity,
  description,
  mitigation,
}: RiskCardProps) {
  const config = severityConfig[severity];

  return (
    <div
      className={cn(
        /* ── Glass background ── */
        "glass rounded-2xl p-5",
        /* ── Left border accent by severity ── */
        "border-l-4",
        config.border,
        /* ── Hover effects ── */
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5",
        "hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      )}
    >
      {/* ── Header: Icon + Name + Badge ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {/*
           * AlertTriangle icon — only shown for HIGH severity risks.
           * Colored red (text-danger) to reinforce urgency.
           * For medium/low, the left border + badge are sufficient.
           */}
          {severity === "high" && (
            <AlertTriangle className="h-4 w-4 text-danger flex-shrink-0" />
          )}
          <h3 className="text-base font-semibold text-foreground">
            {name}
          </h3>
        </div>
        <Badge variant={config.badge} className="flex-shrink-0">
          {config.label}
        </Badge>
      </div>

      {/* ── Description ── */}
      <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
        {description}
      </p>

      {/* ── Mitigation Section ──
       * Visually separated from the description with a subtle
       * background tint and the lightbulb icon.
       */}
      <div className="rounded-xl bg-background-tertiary/50 p-3.5">
        <div className="flex items-start gap-2.5">
          {/*
           * Lightbulb icon — universal symbol for "idea/suggestion".
           * Colored with warning (amber) to contrast with the dark bg
           * and draw attention to the actionable content.
           */}
          <Lightbulb className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
              Mitigation
            </span>
            <p className="text-sm text-foreground-secondary leading-relaxed mt-1">
              {mitigation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
