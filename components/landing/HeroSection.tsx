/* ============================================
   HERO SECTION — The first thing visitors see
   ============================================
   
   🎓 TEACHING NOTES:
   
   The hero section has ONE job: make the visitor understand
   what you do and click the CTA within 5 seconds.
   
   Design principles:
   1. HEADLINE should finish the sentence "We help you..."
   2. SUBTEXT should explain HOW in one sentence
   3. CTA should be obvious and action-oriented
   4. VISUAL should reinforce the concept (radar = scanning/probing)
   
   "use client" because we need:
   - useEffect for mount animations
   - useState for the typing animation effect
   ============================================ */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radar, ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

import { useAuth } from "@/lib/auth-context";

export function HeroSection() {
  const { user } = useAuth();
  /* --- Typing Animation ---
     We cycle through different idea descriptions to show
     the breadth of what IdeaProbe can analyze.
     This creates movement and keeps the hero engaging. */
  const ideas = [
    "An AI tutor that adapts to each student's learning style",
    "A marketplace for local home-cooked meals",
    "A browser extension that summarizes any webpage",
    "A SaaS tool for freelancer invoice management",
    "A platform connecting pet owners with trusted sitters",
  ];
  
  const [currentIdea, setCurrentIdea] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Mount animation trigger
  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  // Typing effect — characters appear one by one
  useEffect(() => {
    const idea = ideas[currentIdea];
    
    if (isTyping) {
      if (displayText.length < idea.length) {
        const timer = setTimeout(() => {
          setDisplayText(idea.slice(0, displayText.length + 1));
        }, 30); // 30ms per character = smooth typing speed
        return () => clearTimeout(timer);
      } else {
        // Finished typing — pause, then start deleting
        const timer = setTimeout(() => setIsTyping(false), 2000);
        return () => clearTimeout(timer);
      }
    } else {
      if (displayText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 15); // Delete faster than type (feels natural)
        return () => clearTimeout(timer);
      } else {
        // Finished deleting — move to next idea
        setTimeout(() => setCurrentIdea((prev) => (prev + 1) % ideas.length), 0);
        setTimeout(() => setIsTyping(true), 0);
      }
    }
  }, [displayText, isTyping, currentIdea, ideas]);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* --- Left Side: Copy & CTA --- */}
          <div
            className={`space-y-8 transition-all duration-1000 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Badge — small credibility signal */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light border-primary/30 text-sm font-medium text-primary-light">
              <Sparkles className="w-4 h-4" />
              <span className="tracking-wide">IdeaProbe V3 is now live</span>
            </div>
            
            {/* Main headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
              AI-powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-primary to-accent animate-shimmer">
                founder intelligence
              </span>
              <br /> for startup validation.
            </h1>
            
            {/* Subtext */}
            <p className="text-lg sm:text-xl text-foreground-secondary max-w-lg leading-relaxed font-medium">
              Paste your startup idea. Get an investor-grade scorecard with 
              real competitors, market sizing, and actionable pivot strategies in{" "}
              <span className="text-foreground font-semibold">30 seconds</span>.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={user ? "/validate" : "/signup"}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary hover:bg-primary-light text-white font-semibold text-lg transition-all duration-300 shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {user ? "Validate an Idea" : "Start Validating Free"}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass-light text-foreground font-semibold text-lg transition-all duration-300 hover:bg-white/10"
              >
                View Pricing
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center gap-6 text-sm text-foreground-tertiary">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-warning" />
                <span>30-second analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-success" />
                <span>3 free validations</span>
              </div>
            </div>
          </div>
          
          {/* --- Right Side: Interactive Demo --- */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Glow Orbs behind the card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] glow-orb -z-10" />

            {/* Mock input card — shows what the product looks like */}
            <div className="glass rounded-2xl p-6 sm:p-8 space-y-6 relative z-10 border border-white/10">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                <span className="ml-3 text-xs text-foreground-tertiary font-mono">
                  ideaprobe.io/validate
                </span>
              </div>
              
              {/* Input area with typing animation */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground-secondary">
                  Describe your startup idea
                </label>
                <div className="min-h-[120px] p-4 rounded-xl bg-background/50 border border-white/5 text-foreground shadow-inner">
                  <span>{displayText}</span>
                  <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
                </div>
              </div>
              
              {/* Fake validate button */}
              <div className="bg-primary/20 text-primary-light border border-primary/30 text-center py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                <Radar className="w-5 h-5" />
                Analyzing Market Data...
              </div>
              
              {/* Score preview */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: "Market Size", score: "9/10", color: "text-success" },
                  { label: "Competitors", score: "6/10", color: "text-warning" },
                  { label: "Feasibility", score: "8/10", color: "text-primary" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="text-center p-3 rounded-lg bg-background/50 border border-white/5"
                  >
                    <div className={`text-xl font-bold ${item.color}`}>
                      {item.score}
                    </div>
                    <div className="text-xs text-foreground-tertiary mt-1">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Floating decorative elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-accent/20 blur-2xl animate-float" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-primary/20 blur-2xl animate-float [animation-delay:1.5s]" />
          </div>
        </div>
      </div>
      
      {/* Huge Background Glow */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden -z-20 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />
      </div>
    </section>
  );
}
