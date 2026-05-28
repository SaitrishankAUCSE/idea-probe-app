"use client";

import { Star } from "lucide-react";

export function Testimonials() {
  const testimonials = [
    {
      name: "Alex Rivera",
      role: "Founder, SyncNote",
      text: "IdeaProbe completely changed our trajectory. The AI caught a major competitor we hadn't seen and suggested a pivot that helped us secure our pre-seed round.",
      rating: 5,
    },
    {
      name: "Sarah Chen",
      role: "Solo Developer",
      text: "It feels like having a YC partner looking over your shoulder. The market sizing was spot on, and the risk assessment was brutally honest—exactly what I needed.",
      rating: 5,
    },
    {
      name: "David Kim",
      role: "CEO, HealthFlow",
      text: "We ran our telemedicine idea through IdeaProbe before writing a single line of code. The 90-day validation roadmap gave us incredible focus.",
      rating: 5,
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] -z-10" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent">ambitious founders</span>
          </h2>
          <p className="text-foreground-secondary text-lg max-w-2xl mx-auto">
            Don't just take our word for it. Here's what early-stage founders and indie hackers are saying about IdeaProbe.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div 
              key={i}
              className="glass-light p-8 rounded-2xl border border-white/10 hover:border-primary/30 transition-colors duration-300"
            >
              <div className="flex items-center gap-1 mb-6 text-warning">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-foreground-secondary leading-relaxed mb-6">
                "{t.text}"
              </p>
              <div>
                <div className="font-semibold text-foreground">{t.name}</div>
                <div className="text-sm text-foreground-tertiary">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
