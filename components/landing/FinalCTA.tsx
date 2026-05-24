/* ============================================
   FINAL CTA — The closing push
   ============================================
   
   🎓 TEACHING NOTES:
   
   The Final CTA section serves as the "closing argument."
   Visitors who've scrolled this far are warm leads —
   they've read your pitch and are considering it.
   
   This section should:
   1. Use urgency language ("stop guessing")
   2. Reinforce the value prop one more time
   3. Make the CTA button unmissable
   
   The gradient background and larger text size create
   visual separation from the rest of the page, making
   it feel like a natural conclusion.
   ============================================ */

"use client";

import Link from "next/link";
import { ArrowRight, Radar } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="max-w-3xl mx-auto relative text-center">
        {/* Animated radar icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-8 animate-pulse-glow">
          <Radar className="w-10 h-10 text-white" />
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
          Stop guessing.
          <br />
          <span className="gradient-text">Start validating.</span>
        </h2>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-foreground-secondary mb-10 max-w-xl mx-auto leading-relaxed">
          Join founders who validate their ideas with data before
          investing months of their time. Your first 3 validations are free.
        </p>

        {/* CTA Button — extra large for emphasis */}
        <Link
          href="/signup"
          className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl gradient-primary text-white font-bold text-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(19,106,183,0.5)] hover:scale-[1.03] active:scale-[0.98]"
        >
          Validate Your First Idea
          <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Reassurance */}
        <p className="text-sm text-foreground-tertiary mt-6">
          No credit card required · 3 free validations · Cancel anytime
        </p>
      </div>
    </section>
  );
}
