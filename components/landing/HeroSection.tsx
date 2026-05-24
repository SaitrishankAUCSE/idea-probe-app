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

export function HeroSection() {
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
    setMounted(true);
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
        setCurrentIdea((prev) => (prev + 1) % ideas.length);
        setIsTyping(true);
      }
    }
  }, [displayText, isTyping, currentIdea]);

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-foreground-secondary">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>AI-Powered Idea Validation</span>
            </div>
            
            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              <span className="gradient-text">Validate</span>
              <br />
              before you build.
            </h1>
            
            {/* Subtext */}
            <p className="text-lg sm:text-xl text-foreground-secondary max-w-lg leading-relaxed">
              Paste your startup idea. Get an AI-powered scorecard with 
              competitors, market analysis, and risk assessment in{" "}
              <span className="text-primary font-semibold">30 seconds</span>.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl gradient-primary text-white font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(19,106,183,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Try for Free
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass text-foreground font-semibold text-lg transition-all duration-300 hover:bg-background-tertiary"
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
            {/* Mock input card — shows what the product looks like */}
            <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-danger/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <span className="ml-3 text-xs text-foreground-tertiary font-mono">
                  ideaprobe.io/validate
                </span>
              </div>
              
              {/* Input area with typing animation */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground-secondary">
                  Describe your startup idea
                </label>
                <div className="min-h-[120px] p-4 rounded-xl bg-background border border-border text-foreground">
                  <span>{displayText}</span>
                  <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
                </div>
              </div>
              
              {/* Fake validate button */}
              <div className="gradient-primary text-white text-center py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                <Radar className="w-5 h-5" />
                Validate My Idea
              </div>
              
              {/* Score preview */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: "Market", score: 8, color: "text-success" },
                  { label: "Risk", score: 6, color: "text-warning" },
                  { label: "Unique", score: 7, color: "text-primary" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="text-center p-3 rounded-lg bg-background-secondary"
                  >
                    <div className={`text-2xl font-bold ${item.color}`}>
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
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-accent/10 blur-xl animate-float" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-primary/10 blur-xl animate-float [animation-delay:1s]" />
          </div>
        </div>
      </div>
    </section>
  );
}
