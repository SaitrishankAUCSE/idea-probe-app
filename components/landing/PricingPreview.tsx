/* ============================================
   PRICING PREVIEW — Condensed pricing on landing page
   ============================================
   
   🎓 TEACHING NOTES:
   
   Showing pricing on the landing page INCREASES conversions.
   Why? Because visitors who scroll this far are interested.
   If they have to click to another page to see the price,
   many will drop off.
   
   The two-tier layout with the "Popular" badge creates 
   an ANCHORING effect — the Pro plan looks like a steal
   compared to what you'd pay a consultant.
   
   $9/mo pricing psychology:
   - Under $10 = "impulse buy" territory
   - Odd number ($9 vs $10) = feels like a deal
   - Monthly = low commitment, easy to cancel
   ============================================ */

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for testing the waters",
    features: [
      "3 validations per month",
      "Competitor scan",
      "Risk score",
      "Basic report",
    ],
    cta: "Get Started",
    ctaHref: "/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For serious founders building real products",
    features: [
      "Unlimited validations",
      "Deep web search",
      "Full PDF report",
      "Save & compare ideas",
      "Priority analysis",
    ],
    cta: "Upgrade to Pro",
    ctaHref: "/signup",
    popular: true,
  },
];

export function PricingPreview() {
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, honest <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-foreground-secondary text-lg max-w-xl mx-auto">
            Start free. Upgrade when you&apos;re ready to get serious.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative glass rounded-2xl p-8 transition-all duration-700 ${
                plan.popular
                  ? "border-primary/40 ring-1 ring-primary/20"
                  : "border-border"
              } ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-white text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Popular
                </div>
              )}

              {/* Plan name */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {plan.popular ? (
                    <Zap className="w-5 h-5 text-primary" />
                  ) : null}
                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                </div>
                <p className="text-sm text-foreground-tertiary">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <span className="text-5xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-foreground-secondary ml-1">
                  {plan.period}
                </span>
              </div>

              {/* Features list */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-foreground-secondary"
                  >
                    <Check
                      className={`w-4 h-4 flex-shrink-0 ${
                        plan.popular ? "text-primary" : "text-success"
                      }`}
                    />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <Link
                href={plan.ctaHref}
                className={`block text-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                  plan.popular
                    ? "gradient-primary text-white hover:shadow-[0_0_30px_rgba(19,106,183,0.3)] hover:scale-[1.02]"
                    : "bg-background-tertiary text-foreground hover:bg-border-hover"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Link to full pricing page */}
        <div className="text-center mt-8">
          <Link
            href="/pricing"
            className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors underline underline-offset-4"
          >
            View full pricing comparison →
          </Link>
        </div>
      </div>
    </section>
  );
}
