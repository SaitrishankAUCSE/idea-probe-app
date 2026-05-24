"use client";

/**
 * ============================================
 * SCORE CARD — Circular progress indicator
 * ============================================
 *
 * WHAT THIS DOES:
 * Displays a score (0–100) as a radial progress ring with an animated
 * count-up effect. Used for the overall IdeaProbe validation score and
 * individual dimension summaries.
 *
 * DESIGN DECISIONS:
 * 1. **SVG circle technique** — We draw two circles:
 *    - A background circle (dim, shows the full track)
 *    - A foreground circle (colored, shows progress via stroke-dashoffset)
 *    This is the standard approach for circular progress indicators.
 *
 * 2. **stroke-dasharray / stroke-dashoffset** — The key SVG trick:
 *    - `dasharray` = circumference (total length of the circle's edge)
 *    - `dashoffset` = circumference × (1 - score/100)
 *    When offset equals circumference, the circle is invisible.
 *    When offset equals 0, the circle is fully drawn.
 *    Transitioning this value creates the "filling" animation.
 *
 * 3. **Color coding** — The score maps to semantic colors:
 *    - 70+ → success (green) — "great idea!"
 *    - 40–69 → warning (amber) — "needs work"
 *    - <40 → danger (red) — "major risks"
 *
 * 4. **Count-up animation** — The center number animates from 0 to the
 *    target score using `requestAnimationFrame` for butter-smooth 60fps.
 *    This is far more engaging than just showing a static number.
 *
 * 5. **Glow effect** — A CSS filter glow matching the score's color
 *    gives the ring a neon/holographic feel on the dark background.
 *
 * 6. **Two sizes** — `sm` for inline/card usage, `lg` for hero displays.
 */

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

/* ── Props ─────────────────────────────────── */

interface ScoreCardProps {
  /** Score from 0 to 100. */
  score: number;
  /** Text label displayed below the ring. */
  label: string;
  /** Physical size of the component. */
  size?: "sm" | "lg";
}

/* ── Size Config ───────────────────────────── */

interface SizeConfig {
  /** SVG viewbox & container width/height */
  dimension: number;
  /** Radius of the progress circle */
  radius: number;
  /** Thickness of the stroke */
  strokeWidth: number;
  /** Font size class for the center number */
  numberClass: string;
  /** Font size class for the label */
  labelClass: string;
}

const sizes: Record<"sm" | "lg", SizeConfig> = {
  sm: {
    dimension: 100,
    radius: 40,
    strokeWidth: 6,
    numberClass: "text-xl font-bold",
    labelClass: "text-xs",
  },
  lg: {
    dimension: 180,
    radius: 72,
    strokeWidth: 8,
    numberClass: "text-4xl font-extrabold",
    labelClass: "text-sm",
  },
};

/* ── Helpers ───────────────────────────────── */

/**
 * Returns the color class based on the score range.
 * This mapping is used for the SVG stroke AND the text/glow.
 */
function getScoreColor(score: number) {
  if (score >= 70) return { stroke: "var(--success)", class: "text-success", glow: "var(--glow-success)" };
  if (score >= 40) return { stroke: "var(--warning)", class: "text-warning", glow: "0 0 20px rgba(245,158,11,0.3)" };
  return { stroke: "var(--danger)", class: "text-danger", glow: "var(--glow-danger)" };
}

/* ── Component ─────────────────────────────── */

export function ScoreCard({
  score,
  label,
  size = "lg",
}: ScoreCardProps) {
  const config = sizes[size];
  const color = getScoreColor(score);

  /*
   * Circumference = 2πr — the total length of the circle's edge.
   * This is the base value for the dasharray/dashoffset calculations.
   */
  const circumference = 2 * Math.PI * config.radius;

  /*
   * The dashoffset determines how much of the circle is "hidden".
   * At offset = circumference, the circle is completely hidden.
   * At offset = 0, the circle is fully drawn.
   * We calculate the visible portion based on the score.
   */
  const targetOffset = circumference * (1 - score / 100);

  /* ── Count-up Animation ──
   * We animate the displayed number from 0 to `score` over ~1 second.
   * requestAnimationFrame gives us smooth 60fps updates.
   */
  const [displayScore, setDisplayScore] = useState(0);
  const [dashOffset, setDashOffset] = useState(circumference);
  const animationStarted = useRef(false);

  useEffect(() => {
    /*
     * Guard against double-firing in React strict mode.
     * Without this, the animation would restart on every re-render.
     */
    if (animationStarted.current) return;
    animationStarted.current = true;

    const duration = 1200; // ms — total animation time
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      /*
       * Easing function: ease-out cubic.
       * progress goes from 0→1 linearly, but eased makes it
       * start fast and slow down — feels more natural.
       */
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(Math.round(eased * score));
      setDashOffset(circumference - eased * (circumference - targetOffset));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [score, circumference, targetOffset]);

  /* ── Center coordinates for the SVG circles ── */
  const center = config.dimension / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* ── SVG Ring ── */}
      <div
        className="relative"
        style={{
          width: config.dimension,
          height: config.dimension,
          /* Glow effect behind the ring — matches score color */
          filter: `drop-shadow(${color.glow})`,
        }}
      >
        <svg
          width={config.dimension}
          height={config.dimension}
          viewBox={`0 0 ${config.dimension} ${config.dimension}`}
          className="transform -rotate-90"
          /*
           * WHY -rotate-90?
           * SVG circles start drawing at 3 o'clock (east).
           * Rotating -90° makes them start at 12 o'clock (north),
           * which is the conventional starting point for progress rings.
           */
        >
          {/* ── Background Track ──
           * A dim circle showing the full 360° track.
           */}
          <circle
            cx={center}
            cy={center}
            r={config.radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={config.strokeWidth}
            className="opacity-40"
          />

          {/* ── Progress Arc ──
           * The colored arc that fills based on the score.
           * `strokeLinecap="round"` gives the ends rounded caps.
           */}
          <circle
            cx={center}
            cy={center}
            r={config.radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-100 ease-out"
          />
        </svg>

        {/* ── Center Number ──
         * Positioned absolutely in the center of the SVG.
         * Shows the animated count-up number.
         */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(config.numberClass, color.class)}>
            {displayScore}
          </span>
        </div>
      </div>

      {/* ── Label ── */}
      <span
        className={cn(
          config.labelClass,
          "text-foreground-secondary font-medium"
        )}
      >
        {label}
      </span>
    </div>
  );
}
