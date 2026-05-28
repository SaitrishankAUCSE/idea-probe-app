/* ============================================
   VALIDATE PAGE — app/validate/page.tsx
   ============================================
   
   🎓 TEACHING NOTES:
   
   This is the CORE of the product — the page where users
   type their startup idea and click "Validate."
   
   Design decisions:
   1. ONE textarea, ONE button. No forms, no fields.
      Friction kills conversion. Keep it stupidly simple.
   2. Show remaining validations (creates urgency for free users)
   3. Show tips for better results (improves output quality)
   4. The LoadingScreen component covers the page during analysis
   
   Data flow:
   1. User types idea → clicks "Validate My Idea"
   2. We POST to /api/validate with { idea, token }
   3. API calls Claude, saves to Firestore, returns result
   4. We redirect to /validate/{validationId} (results page)
   
   Protected route:
   This page uses AuthGuard to require login.
   If you're not signed in, you get redirected to /login.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { AuthGuard } from "@/components/AuthGuard";
import { AILoadingAnimation } from "@/components/AILoadingAnimation";
import {
  Radar,
  Lightbulb,
  AlertCircle,
  Sparkles,
  Loader2,
  Zap,
  CheckCircle2,
  Lock,
  Crown,
} from "lucide-react";

/* Helpful tips that rotate — teach users how to write better prompts */
const tips = [
  "Describe who your target customer is",
  "Mention the specific problem you're solving",
  "Include how your solution is different from existing options",
  "Be specific about the business model (SaaS, marketplace, etc.)",
  "Mention the market or industry you're targeting",
];

export default function ValidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const isUpgraded = searchParams.get("upgraded") === "true";
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(isUpgraded);

  const [idea, setIdea] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");
  const [currentTip, setCurrentTip] = useState(0);
  const [usageInfo, setUsageInfo] = useState({
    plan: "free" as "free" | "pro" | "elite" | "visionary",
    used: 0,
    limit: 3 as number | "Unlimited",
  });

  /* Auto-hide upgrade success */
  useEffect(() => {
    if (showUpgradeSuccess) {
      const timeout = setTimeout(() => {
        setShowUpgradeSuccess(false);
        router.replace("/validate");
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [showUpgradeSuccess, router]);

  /* Pre-fill templates */
  const templates = [
    { label: "B2B SaaS", text: "A B2B SaaS platform that helps [target customer] solve [specific problem] by [core feature]. We will monetize through [pricing model] and our main differentiator is [unique advantage]." },
    { label: "Marketplace", text: "A two-sided marketplace connecting [supply side] with [demand side]. The core problem we solve is [friction in current market]. We take a [%] take rate on GMV. Our initial GTM strategy focuses on [specific niche]." },
    { label: "AI Tool", text: "An AI-powered tool that automates [workflow] for [target user]. It integrates with [existing tools] and uses [specific data/model] to achieve [outcome]. Target pricing is [price]/mo." },
  ];

  /* Rotate tips every 4 seconds */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  /* Fetch user's current usage on mount */
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const data = await res.json();
          setUsageInfo(data);
        }
      } catch {
        // Silently fail — usage display is nice-to-have
      }
    };
    fetchUsage();
  }, [user]);

  /* --- Handle Validation --- */
  const handleValidate = async () => {
    if (!idea.trim()) {
      setError("Please describe your startup idea first.");
      return;
    }

    if (idea.trim().length < 20) {
      setError("Please provide more detail — at least a sentence or two.");
      return;
    }

    if (usageInfo.plan === "free" && typeof usageInfo.limit === "number" && usageInfo.used >= usageInfo.limit) {
      router.push("/pricing");
      return;
    }

    setError("");
    setIsValidating(true);

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea: idea.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 429) {
          setError(
            "You've used all your free validations this month. Upgrade to Pro for unlimited access."
          );
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        setIsValidating(false);
        return;
      }

      const data = await response.json();
      /* Navigate to the results page */
      router.push(`/validate/${data.validationId}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setIsValidating(false);
    }
  };

  /* Character count with color coding */
  const charCount = idea.length;
  const getCharCountColor = () => {
    if (charCount === 0) return "text-foreground-tertiary";
    if (charCount < 20) return "text-danger";
    if (charCount < 50) return "text-warning";
    return "text-success";
  };

  return (
    <AuthGuard>
      {/* Upgrade Success Animation */}
      <AnimatePresence>
        {showUpgradeSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="text-center relative p-8"
            >
              {/* Glowing Orb Backdrop */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div 
                  animate={{ scale: [1, 2, 3], opacity: [1, 0.5, 0] }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="w-40 h-40 rounded-full bg-success/40 blur-3xl absolute" 
                />
              </div>

              <motion.div 
                initial={{ y: 50, scale: 0.5 }}
                animate={{ y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 300 }}
                className="w-24 h-24 mx-auto bg-gradient-to-br from-success to-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.5)] relative z-10"
              >
                <Crown className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-4 gradient-text-success relative z-10"
              >
                Upgrade Successful!
              </motion.h2>
              
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-foreground-secondary max-w-md mx-auto relative z-10"
              >
                Your account is now upgraded. Welcome to the elite tier of startup founders.
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading screen overlay — shows premium animation while AI analyzes */}
      <AILoadingAnimation isVisible={isValidating} />

      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        {/* Background decorations */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
        </div>

        <div className="w-full max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
              <Radar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Validate Your Idea
            </h1>
            <p className="text-foreground-secondary">
              Describe your startup idea below. Be as specific as possible for
              better results.
            </p>
          </div>

          {/* Main card */}
          <div className="glass rounded-2xl p-6 sm:p-8">
            {/* Usage counter */}
            <div className="flex items-center justify-between mb-4">
              <div className="absolute top-4 right-4 text-sm font-medium">
                {usageInfo.plan === "visionary" || usageInfo.plan === "elite" ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary-light">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Unlimited Validations</span>
                  </div>
                ) : usageInfo.plan === "pro" ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary-light">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pro: {usageInfo.used}/{usageInfo.limit} used today</span>
                  </div>
                ) : (
                  <span className="text-foreground-secondary">
                    <span
                      className={
                        typeof usageInfo.limit === "number" && usageInfo.used >= usageInfo.limit
                          ? "text-danger font-semibold"
                          : "text-foreground"
                      }
                    >
                      {usageInfo.used}
                    </span>
                    /{usageInfo.limit} free validations used
                  </span>
                )}
              </div>

              {usageInfo.plan === "free" &&
                typeof usageInfo.limit === "number" &&
                usageInfo.used >= usageInfo.limit && (
                  <a
                    href="/pricing"
                    className="text-sm text-primary hover:text-primary-light font-medium transition-colors"
                  >
                    Upgrade →
                  </a>
                )}
            </div>

            {/* Template Chips */}
            <div className="mb-4">
              <div className="text-xs text-foreground-tertiary mb-2 font-medium uppercase tracking-wider">Start with a template</div>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.label}
                    onClick={() => setIdea(tpl.text)}
                    className="text-xs px-3 py-1.5 rounded-full bg-background-secondary border border-white/5 hover:border-primary/50 hover:text-primary-light transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit Reached Warning Banner */}
            <AnimatePresence>
              {usageInfo.plan === "free" && typeof usageInfo.limit === "number" && usageInfo.used >= usageInfo.limit && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-light rounded-xl p-5 border border-warning/30 bg-warning/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-warning font-bold text-lg mb-1">Free Limit Reached</h3>
                      <p className="text-foreground-secondary text-sm">
                        You&apos;ve used all {usageInfo.limit} of your free validations for today. Upgrade your plan to continue validating ideas and get deep AI analysis.
                      </p>
                    </div>
                    <a href="/pricing" className="flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-warning text-black font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02] transition-transform">
                      <Zap className="w-4 h-4" />
                      Upgrade to Pro
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Example: A mobile app that helps remote workers find and book co-working spaces near them..."
                rows={8}
                maxLength={2000}
                disabled={isValidating}
                className="w-full p-5 rounded-xl bg-background/50 border border-white/10 text-foreground placeholder:text-foreground-tertiary/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all resize-none text-base leading-relaxed disabled:opacity-50 shadow-inner"
              />

              {/* Character counter */}
              <div
                className={`absolute bottom-3 right-3 text-xs ${getCharCountColor()}`}
              >
                {charCount}/2000
              </div>
            </div>

            {/* Rotating tip */}
            <div className="flex items-start gap-2 mt-3 text-sm text-foreground-tertiary">
              <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
              <span
                key={currentTip}
                className="animate-fade-in"
              >
                <span className="font-medium text-foreground-secondary">
                  Tip:
                </span>{" "}
                {tips[currentTip]}
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 mt-4 text-sm text-danger bg-danger/10 px-4 py-3 rounded-lg animate-slide-down">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Validate button */}
            <button
              onClick={handleValidate}
              disabled={isValidating || !idea.trim()}
              className="w-full mt-6 py-4 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-lg transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-3"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (usageInfo.plan === "free" && typeof usageInfo.limit === "number" && usageInfo.used >= usageInfo.limit) ? (
                <>
                  <Zap className="w-5 h-5" />
                  Limit Reached - Upgrade to Pro
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Validate My Idea
                </>
              )}
            </button>
          </div>

          {/* What you'll get */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Competitors", icon: "🔍" },
              { label: "Market Size", icon: "📊" },
              { label: "Risk Score", icon: "⚠️" },
              { label: "Next Steps", icon: "🚀" },
            ].map((item) => (
              <div
                key={item.label}
                className="glass-light rounded-xl p-3 text-center text-sm"
              >
                <div className="text-lg mb-1">{item.icon}</div>
                <div className="text-foreground-secondary text-xs">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
