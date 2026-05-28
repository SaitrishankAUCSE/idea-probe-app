/* ============================================
   PRICING PAGE — app/pricing/page.tsx
   ============================================
   
   The full pricing page with Razorpay checkout integration.
   
   This is a client component because the buttons need to trigger
   different actions based on auth state:
   - Not logged in → redirect to /signup
   - Logged in (Free plan clicking Free) → Go to /validate
   - Logged in (clicking Pro) → Trigger Razorpay Checkout popup
   
   Razorpay Checkout flow:
   1. User clicks "Upgrade"
   2. We POST to /api/razorpay/create-order
   3. API creates a Razorpay Order and returns order details
   4. We open the Razorpay popup with order details
   5. On successful payment, we verify via /api/razorpay/verify
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
    price: "₹0",
    annualPrice: "₹0",
    period: "forever",
    annualPeriod: "forever",
    description: "Perfect for testing the waters",
    features: [
      "3 validations per day",
      "Competitor scan",
      "Risk score",
      "Basic report",
    ],
    priceId: "free",
    popular: false,
  },
  {
    name: "Pro",
    price: "₹900",
    annualPrice: "₹750",
    period: "/month",
    annualPeriod: "/mo, billed annually",
    description: "For serious founders building real products",
    features: [
      "10 validations per day",
      "Deep web search",
      "Full PDF report",
      "CSV competitor/risk export",
      "Priority analysis",
    ],
    priceId: "pro",
    popular: true,
  },
  {
    name: "Visionary",
    price: "₹2,499",
    annualPrice: "₹1,999",
    period: "/month",
    annualPeriod: "/mo, billed annually",
    description: "For power users launching multiple projects",
    features: [
      "Unlimited validations",
      "Advanced Reasoning AI (Gemini 2.5 Pro)",
      "Deep-dive SWOT Analysis",
      "Actionable Pivot Suggestions",
      "Full PDF & CSV export",
      "Priority founder support",
    ],
    priceId: "visionary",
    popular: false,
  },
];

const faqs = [
  {
    q: "Do I need a credit card for the free plan?",
    a: "No. You can sign up and validate 3 ideas completely free without entering any payment details.",
  },
  {
    q: "How does the AI search the web?",
    a: "We use Gemini AI equipped with Google Search grounding. It actively searches for your specific idea, finds live competitors, and extracts market data on the fly.",
  },
  {
    q: "What is the difference between standard and advanced AI?",
    a: "Our Free and Pro tiers use Gemini 2.5 Flash for fast, comprehensive validations. The Visionary plan utilizes Google's state-of-the-art reasoning model (Gemini 2.5 Pro) to perform ultra-deep logical deductions and SWOT analysis.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can manage your subscription or cancel anytime. Contact support@ideaprobe.io and we&apos;ll handle it immediately. No questions asked.",
  },
  {
    q: "What's in the PDF report?",
    a: "The Pro and Visionary plans include a downloadable PDF containing your full scorecard, competitor links, risk mitigation strategies, and an executive summary. Perfect for sharing with co-founders or investors.",
  },
  {
    q: "How are payments processed?",
    a: "All payments are securely processed through Razorpay, India's leading payment gateway. We support UPI, cards, net banking, and wallets.",
  },
];

/* Load Razorpay checkout script dynamically */
const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  /* Handle clicking a plan button */
  const handleSelectPlan = async (priceId: string) => {
    // If not logged in, send to signup
    if (!user) {
      router.push("/signup");
      return;
    }

    // If selecting free, just go to dashboard
    if (priceId === "free") {
      router.push("/dashboard");
      return;
    }

    // If selecting pro/elite, start Razorpay Checkout
    setLoadingPlan(priceId);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        alert("Failed to load payment gateway. Please try again.");
        return;
      }

      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: priceId }),
      });
      const data = await res.json();

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "IdeaProbe",
        description: `${priceId.charAt(0).toUpperCase() + priceId.slice(1)} Plan — Subscription`,
        order_id: data.orderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (response: any) => {
          // Verify payment on server
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            router.push("/validate?upgraded=true");
          } else {
            alert("Payment verification failed. Please contact support@ideaprobe.io.");
          }
        },
        prefill: { email: user.email || "" },
        theme: { color: "#16A34A" },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 relative">
          {user && (
            <button 
              onClick={() => router.push("/dashboard")}
              className="absolute right-0 top-0 text-sm text-foreground-secondary hover:text-primary transition-colors"
            >
              Skip for now →
            </button>
          )}
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, honest <span className="gradient-text">pricing</span>
          </h1>
          <p className="text-foreground-secondary text-lg max-w-xl mx-auto mb-10">
            Start free. Upgrade when you&apos;re ready to get serious.
            No hidden fees, cancel anytime.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-foreground" : "text-foreground-tertiary"}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 rounded-full bg-background-secondary border border-border p-1 transition-colors hover:border-primary/50"
            >
              <div 
                className={`w-5 h-5 rounded-full gradient-primary transition-all duration-300 shadow-md ${isAnnual ? "translate-x-7" : "translate-x-0"}`} 
              />
            </button>
            <span className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${isAnnual ? "text-foreground" : "text-foreground-tertiary"}`}>
              Annually <span className="text-[10px] uppercase font-bold bg-success/15 text-success px-1.5 py-0.5 rounded-full">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative glass rounded-3xl p-8 sm:p-10 transition-all duration-300 flex flex-col justify-between ${
                plan.popular
                  ? "border-primary/50 ring-1 ring-primary/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] lg:scale-105 z-10 bg-primary/5"
                  : "border-white/10"
              }`}
            >
              <div>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-white text-sm font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
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
                  <span className="text-5xl font-bold">{isAnnual ? plan.annualPrice : plan.price}</span>
                  <span className="text-foreground-secondary text-lg ml-1">
                    {isAnnual ? plan.annualPeriod : plan.period}
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
              </div>

              <button
                onClick={() => handleSelectPlan(plan.priceId)}
                disabled={loadingPlan !== null}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-primary hover:bg-primary-light text-white shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:scale-[1.02]"
                    : "glass-light text-foreground border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01]"
                }`}
              >
                {loadingPlan === plan.priceId ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  plan.name === "Free" ? (user ? "Continue Free" : "Get Started") : `Upgrade to ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Manual UPI Payment Banner */}
        <div className="max-w-3xl mx-auto mb-24">
          <div className="glass-light rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 border border-primary/20 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -z-10" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-foreground mb-2">Prefer direct UPI transfer?</h3>
              <p className="text-foreground-secondary text-sm mb-4">
                You can skip the payment gateway and upgrade instantly by transferring directly via any UPI app (GPay, PhonePe, Paytm).
              </p>
              <div className="inline-flex items-center gap-3 bg-background/80 px-4 py-2 rounded-xl border border-white/10 font-mono text-primary-light font-bold select-all">
                saitrishankb9@ybl
              </div>
            </div>
            <div className="flex-shrink-0">
              <a 
                href="upi://pay?pa=saitrishankb9@ybl&pn=IdeaProbe&cu=INR"
                className="block px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform"
              >
                Pay via UPI App
              </a>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="glass-light rounded-2xl p-6 sm:p-8 flex gap-4 items-start border border-white/5">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{faq.q}</h3>
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
