/* ============================================
   HOW IT WORKS — 3-step visual explanation
   ============================================
   
   🎓 TEACHING NOTES:
   
   The "How It Works" section reduces friction by showing
   the product is SIMPLE. Three steps max — any more and
   visitors feel overwhelmed.
   
   Design pattern: Numbered steps with icons and connecting lines.
   This creates a visual flow that guides the eye left→right.
   
   We use Intersection Observer to trigger animations when
   the section scrolls into view. This is MUCH better than
   animating on page load (user might not even see it yet).
   ============================================ */

"use client";

import { useEffect, useRef, useState } from "react";
import { PenLine, Radar, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: PenLine,
    title: "Describe Your Idea",
    description:
      "Paste your startup concept in plain English. No templates, no forms — just describe what you want to build and who it's for.",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  {
    number: "02",
    icon: Radar,
    title: "AI Analyzes Everything",
    description:
      "Our AI scans the web for competitors, estimates market size, identifies risks, and evaluates feasibility — all in about 30 seconds.",
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Get Your Scorecard",
    description:
      "Receive a detailed report with scores across 5 dimensions, competitor analysis, risk assessment, and actionable next steps.",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  /* --- Intersection Observer ---
     This watches the section and triggers the animation
     when 20% of it is visible in the viewport.
     
     WHY not just animate on mount?
     Because the section might be below the fold.
     Users should see the animation happen, not miss it. */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only animate once
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
            From idea to insight in three simple steps.
            No signup required for your first validation.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/30 via-accent/30 to-success/30" />

          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`relative transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              /* Stagger the animation — each card appears 200ms after the previous */
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className={`glass rounded-2xl p-8 h-full border ${step.borderColor} transition-all duration-300 hover:scale-[1.02]`}>
                {/* Step number + icon */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl ${step.bgColor} flex items-center justify-center`}>
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <span className={`text-sm font-mono font-bold ${step.color}`}>
                    STEP {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow between steps (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-6 lg:-right-8 top-24 text-foreground-tertiary">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
