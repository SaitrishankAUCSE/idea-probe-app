/* ============================================
   LANDING PAGE — app/page.tsx
   ============================================
   
   🎓 TEACHING NOTES:
   
   This is the homepage — the first thing visitors see.
   It's a SERVER COMPONENT by default (no "use client" at the top).
   
   Why server component for a landing page?
   - Faster initial load (HTML is pre-rendered on the server)
   - Better SEO (search engines see the full HTML)
   - No JavaScript needed for static content
   
   But we need some interactive parts (animations on scroll, etc).
   For those, we'll use CLIENT COMPONENTS imported into this page.
   This pattern is called "islands of interactivity."
   ============================================ */

import Link from "next/link";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingPreview } from "@/components/landing/PricingPreview";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* --- Background Decoration ---
          These are subtle gradient blobs that float behind content.
          They create depth and make the page feel "alive".
          position: absolute + z-[-1] means they're behind everything. */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Top-right blue glow */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        {/* Bottom-left purple glow */}
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
        {/* Center green subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-success/3 blur-[150px]" />
      </div>

      {/* Hero Section */}
      <HeroSection />

      {/* Trust Counters */}
      <StatsSection />

      {/* How It Works — 3 steps */}
      <HowItWorks />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Testimonials */}
      <Testimonials />

      {/* Pricing Preview */}
      <PricingPreview />

      {/* Final CTA */}
      <FinalCTA />
    </div>
  );
}
