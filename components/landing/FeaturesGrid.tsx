/* ============================================
   FEATURES GRID — What IdeaProbe does
   ============================================
   
   🎓 TEACHING NOTES:
   
   Features sections answer "What do I get?"
   Each feature card should:
   1. Have a clear icon (visual anchor)
   2. One-line title (scannable)
   3. Short description (2 lines max)
   
   We use a responsive grid:
   - Mobile: 1 column (stacked)
   - Tablet: 2 columns
   - Desktop: 3 columns
   
   Tailwind's responsive prefixes: sm:, md:, lg:
   They work mobile-first (base = mobile, sm = ≥640px, etc.)
   ============================================ */

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Globe,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Competitor Discovery",
    description:
      "AI searches the web to find existing products solving the same problem. Know your competition before you write a line of code.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    title: "Market Analysis",
    description:
      "Get estimated market size, growth trends, and TAM. Understand if the opportunity is worth pursuing.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: AlertTriangle,
    title: "Risk Assessment",
    description:
      "Identifies the riskiest assumption in your idea and suggests how to validate it before investing time and money.",
    color: "text-danger",
    bgColor: "bg-danger/10",
  },
  {
    icon: Lightbulb,
    title: "Feasibility Score",
    description:
      "Evaluates technical complexity, resource requirements, and time-to-market for your specific idea.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Globe,
    title: "Real-Time Web Search",
    description:
      "Not based on stale training data. AI actively searches the web to find the latest competitors and market data.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: FileText,
    title: "Detailed Reports",
    description:
      "Get a comprehensive scorecard with actionable next steps, not just a number. Save and compare multiple ideas.",
    color: "text-primary-light",
    bgColor: "bg-primary-light/10",
  },
];

export function FeaturesGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-background-secondary/50"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to{" "}
            <span className="gradient-text">validate</span>
          </h2>
          <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
            Stop guessing. Get data-driven insights powered by AI 
            and real-time web research.
          </p>
        </div>

        {/* Features grid — responsive layout */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group glass rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02] hover:border-border-hover ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-foreground-secondary text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
