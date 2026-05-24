"use client";

/**
 * ============================================
 * LOADING SCREEN — Animated radar scanner overlay
 * ============================================
 *
 * WHAT THIS DOES:
 * A full-screen overlay shown during idea validation (the AI analysis
 * takes 10-30 seconds). Instead of a boring spinner, we show:
 * - An SVG radar graphic with a sweeping scan line
 * - Concentric circles (like a real radar screen)
 * - Dots that appear and fade (simulating "findings")
 * - Rotating status messages that cycle every 2-3 seconds
 * - A subtle progress bar at the bottom
 *
 * DESIGN DECISIONS:
 * 1. **Radar metaphor** — IdeaProbe's brand identity is built on
 *    "scanning" and "probing" — the radar visual reinforces this.
 *    The Radar icon in the logo matches this loading animation.
 *
 * 2. **Rotating messages** — Instead of a generic "Loading...", we show
 *    stage-specific messages that make the wait feel productive:
 *    "Scanning competitors...", "Analyzing market size...", etc.
 *    Users perceive targeted progress as faster than generic spinners.
 *
 * 3. **Glassmorphism overlay** — The glass background lets the page
 *    content peek through, maintaining spatial context. The user
 *    knows they're still on the same page.
 *
 * 4. **CSS-only animations** — All animations are pure CSS (no JS
 *    physics engine needed). The sweeping line uses `animate-radar-sweep`
 *    (a 360° rotation). The dots use staggered `animation-delay`.
 *
 * 5. **isVisible prop** — Controls whether the overlay is rendered.
 *    When false, nothing renders (no hidden DOM nodes).
 *
 * PERFORMANCE NOTE:
 * `backdrop-filter: blur()` can be GPU-intensive. On low-end devices,
 * consider reducing blur or using a solid overlay instead.
 */

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

/* ── Props ─────────────────────────────────── */

interface LoadingScreenProps {
  /** Controls visibility. When false, the component renders nothing. */
  isVisible: boolean;
  /** Optional custom messages to cycle through. Falls back to defaults. */
  messages?: string[];
}

/* ── Default Messages ──────────────────────── */

const DEFAULT_MESSAGES = [
  "Scanning competitors...",
  "Analyzing market size...",
  "Assessing risks...",
  "Evaluating feasibility...",
  "Calculating score...",
];

/* ── Radar Dots ────────────────────────────── */

/**
 * Configuration for the "found" dots that appear and fade on the radar.
 * Each dot has an x/y position (relative to the radar center) and a
 * staggered animation delay so they don't all appear at once.
 *
 * WHY hard-coded positions?
 * Random positions would jump on re-render. Fixed positions with
 * staggered delays create a predictable, polished pattern.
 */
const RADAR_DOTS = [
  { x: 30, y: -45, delay: 0.3 },
  { x: -55, y: 20, delay: 1.1 },
  { x: 15, y: 50, delay: 1.8 },
  { x: -35, y: -30, delay: 2.5 },
  { x: 50, y: -10, delay: 0.7 },
  { x: -20, y: 55, delay: 1.4 },
  { x: 40, y: 35, delay: 2.1 },
];

/* ── Component ─────────────────────────────── */

export function LoadingScreen({
  isVisible,
  messages,
}: LoadingScreenProps) {
  const statusMessages = messages || DEFAULT_MESSAGES;

  /*
   * Cycling messages — update every 2.5 seconds.
   * We use modular arithmetic to loop through the array infinitely.
   */
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isVisible, statusMessages.length]);

  /*
   * Progress bar — slowly fills over ~30 seconds.
   * This gives the user a sense of forward movement even though
   * we don't know the real progress of the AI analysis.
   * The "fake progress" pattern (used by GitHub, Vercel, etc.).
   */
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        /*
         * Progress slows down as it approaches 90%.
         * This prevents it from "finishing" before the real analysis does.
         * The remaining 10% is filled when the results actually arrive.
         */
        if (prev >= 90) return prev;
        const increment = Math.max(0.5, (90 - prev) * 0.03);
        return Math.min(90, prev + increment);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isVisible]);

  /* Memoize the radar center for SVG calculations */
  const center = 120; // Center of the 240×240 SVG viewBox
  const rings = useMemo(() => [30, 55, 80, 105], []); // Concentric ring radii

  /* ── Don't render when hidden ── */
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        /* ── Full-screen overlay ── */
        "fixed inset-0 z-[100]",
        /* ── Glass background ── */
        "bg-background/80 backdrop-blur-xl",
        /* ── Center content ── */
        "flex flex-col items-center justify-center gap-8",
        /* ── Entrance animation ── */
        "animate-fade-in"
      )}
      /* Prevent interaction with elements behind the overlay */
      role="dialog"
      aria-modal="true"
      aria-label="Analyzing your idea"
    >
      {/* ── Radar SVG ── */}
      <div className="relative">
        <svg
          width="240"
          height="240"
          viewBox="0 0 240 240"
          className="animate-fade-in"
        >
          {/* ── Concentric Rings ──
           * Four circles at increasing radii create the classic radar look.
           * Low opacity (0.15) keeps them subtle — the sweep line is the star.
           */}
          {rings.map((r) => (
            <circle
              key={r}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1"
              opacity="0.15"
            />
          ))}

          {/* ── Crosshair Lines ──
           * Horizontal and vertical lines through the center.
           * Very faint — just enough to reinforce the "radar grid" look.
           */}
          <line
            x1={center}
            y1={center - 110}
            x2={center}
            y2={center + 110}
            stroke="var(--primary)"
            strokeWidth="0.5"
            opacity="0.1"
          />
          <line
            x1={center - 110}
            y1={center}
            x2={center + 110}
            y2={center}
            stroke="var(--primary)"
            strokeWidth="0.5"
            opacity="0.1"
          />

          {/* ── Outer Ring ──
           * The main border of the radar. Slightly thicker and brighter
           * than the concentric rings to define the boundary.
           */}
          <circle
            cx={center}
            cy={center}
            r="108"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.5"
            opacity="0.3"
          />

          {/* ── Center Dot ──
           * The bright center point of the radar. Small but vivid.
           */}
          <circle
            cx={center}
            cy={center}
            r="3"
            fill="var(--primary)"
            opacity="0.8"
          />

          {/* ── Sweep Line ──
           * A gradient line that rotates 360° continuously.
           * This is the "scanning beam" that makes the radar feel alive.
           *
           * The conic-gradient trick:
           * We use a <line> element inside a <g> that rotates.
           * The line goes from center to the edge of the outer ring.
           */}
          <g
            style={{
              transformOrigin: `${center}px ${center}px`,
            }}
            className="animate-radar-sweep"
          >
            {/* Sweep line — from center to top edge */}
            <line
              x1={center}
              y1={center}
              x2={center}
              y2={center - 108}
              stroke="var(--primary)"
              strokeWidth="2"
              opacity="0.8"
            />

            {/*
             * Sweep "tail" — a fading triangular arc behind the line.
             * This creates the radar sweep effect where the area behind
             * the line briefly glows then fades.
             * We use a gradient-filled path (pie slice) for this.
             */}
            <path
              d={`M ${center} ${center} L ${center} ${center - 108} A 108 108 0 0 0 ${center - 108 * Math.sin(Math.PI / 6)} ${center - 108 * Math.cos(Math.PI / 6)} Z`}
              fill="url(#sweepGradient)"
              opacity="0.15"
            />
          </g>

          {/* ── Gradient Definition for the Sweep Tail ── */}
          <defs>
            <radialGradient id="sweepGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ── Radar Dots ──
           * Small circles that appear and fade at fixed positions.
           * Each dot has a staggered animation-delay for variety.
           * The `pulse` animation makes them glow in and out.
           */}
          {RADAR_DOTS.map((dot, i) => (
            <circle
              key={i}
              cx={center + dot.x}
              cy={center + dot.y}
              r="3"
              fill="var(--success)"
              opacity="0"
              className="animate-pulse"
              style={{
                animationDelay: `${dot.delay}s`,
                animationDuration: "2s",
              }}
            />
          ))}
        </svg>

        {/* ── Outer Glow ──
         * A radial glow behind the entire radar SVG.
         * Creates the "holographic display" look.
         */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, rgba(19, 106, 183, 0.1) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Status Message ──
       * Cycles through the messages array every 2.5s.
       * Each new message fades in via a key-based re-mount animation.
       */}
      <div className="text-center space-y-2 h-16 flex flex-col items-center justify-center">
        <p
          key={messageIndex}
          className="text-lg font-medium text-foreground animate-fade-in"
        >
          {statusMessages[messageIndex]}
        </p>
        <p className="text-sm text-foreground-tertiary">
          This usually takes 15–30 seconds
        </p>
      </div>

      {/* ── Progress Bar ──
       * A slim bar at the bottom that slowly fills.
       * Gives a sense of forward movement even though
       * we don't know the real progress.
       */}
      <div className="w-64 sm:w-80">
        <div className="h-1 rounded-full bg-background-tertiary overflow-hidden">
          <div
            className="h-full rounded-full gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-foreground-tertiary text-center mt-2">
          {Math.round(progress)}% analyzed
        </p>
      </div>
    </div>
  );
}
