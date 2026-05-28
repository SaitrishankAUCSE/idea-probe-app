"use client";

import { useEffect, useState } from "react";

export function StatsSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    { label: "Startups Analyzed", value: "10,000+", suffix: "" },
    { label: "Active Founders", value: "3,000+", suffix: "" },
    { label: "AI Insight Accuracy", value: "95", suffix: "%" },
    { label: "Average Time Saved", value: "40", suffix: "hrs" },
  ];

  return (
    <section className="py-20 relative border-y border-white/5 bg-background-secondary/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className={`space-y-2 transition-all duration-1000 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                {stat.value}
                <span className="text-primary-light ml-1">{stat.suffix}</span>
              </div>
              <div className="text-sm font-medium tracking-wide text-foreground-tertiary uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
