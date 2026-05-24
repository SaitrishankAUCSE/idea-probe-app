/* ============================================
   PRICING PAGE — app/pricing/page.tsx
   ============================================
   
   🎓 TEACHING NOTES:
   
   The full pricing page. It builds on the PricingPreview
   we used on the landing page, but adds more detail and FAQs.
   
   This is a client component because the buttons need to trigger
   different actions based on auth state:
   - Not logged in → redirect to /signup
   - Logged in (Free plan clicking Free) → Go to /validate
   - Logged in (clicking Pro) → Trigger Stripe Checkout
   
   Stripe Checkout flow:
   1. User clicks "Upgrade"
   2. We POST to /api/stripe/checkout
   3. API creates a Stripe Session URL and returns it
   4. We redirect the user to that URL
   ============================================ */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Check, Sparkles, Zap, Loader2, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
    priceId: "free",
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
    priceId: "pro", // Maps to STRIPE_PRO_PRICE_ID in backend
    popular: true,
  },
];

const faqs = [
  {
    q: "Do I need a credit card for the free plan?",
    a: "No. You can sign up and validate 3 ideas completely free without entering any payment details.",
  },
  {
    q: "How does the AI search the web?",
    a: "We use Claude 3.5 Sonnet equipped with a real-time web search tool. It actively searches for your specific idea, finds live competitors, and extracts market data on the fly.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can manage your subscription or cancel anytime from your dashboard. No questions asked.",
  },
  {
    q: "What's in the PDF report?",
    a: "The Pro plan includes a downloadable PDF containing your full scorecard, competitor links, risk mitigation strategies, and an executive summary. Perfect for sharing with co-founders or investors.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  /* Handle clicking a plan button */
  const handleSelectPlan = async (priceId: string) => {
    // If not logged in, send to signup
    if (!user) {
      router.push("/signup");
      return;
    }

    // If selecting free, just go to validate
    if (priceId === "free") {
      router.push("/validate");
      return;
    }

    // If selecting pro, start Stripe Checkout
    setLoadingPlan(priceId);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      
      if (data.url) {
        // Redirect to Stripe's hosted checkout page
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to start checkout. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, honest <span className="gradient-text">pricing</span>
          </h1>
          <p className="text-foreground-secondary text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready to get serious.
            No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-24">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative glass rounded-3xl p-8 sm:p-10 transition-all duration-300 ${
                plan.popular
                  ? "border-primary/40 ring-1 ring-primary/20 shadow-[0_0_40px_rgba(19,106,183,0.1)] scale-100 md:scale-105 z-10"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full gradient-primary text-white text-sm font-bold flex items-center gap-1.5 shadow-lg">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  {plan.popular && <Zap className="w-6 h-6 text-primary" />}
                  <h2 className="text-2xl font-bold">{plan.name}</h2>
                </div>
                <p className="text-foreground-secondary">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-6xl font-bold">{plan.price}</span>
                <span className="text-foreground-secondary text-lg ml-1">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={`mt-1 rounded-full p-0.5 ${plan.popular ? "bg-primary/20 text-primary" : "bg-success/20 text-success"}`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-foreground-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.priceId)}
                disabled={loadingPlan !== null}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "gradient-primary text-white hover:shadow-[0_0_30px_rgba(19,106,183,0.4)] hover:scale-[1.02]"
                    : "glass text-foreground hover:bg-border-hover"
                }`}
              >
                {loadingPlan === plan.priceId ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  plan.name === "Free" ? "Get Started" : "Upgrade to Pro"
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="glass rounded-2xl p-6 sm:p-8 flex gap-4 items-start">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-foreground-secondary leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
