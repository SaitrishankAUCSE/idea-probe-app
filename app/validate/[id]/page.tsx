/* ============================================
   RESULTS PAGE — app/validate/[id]/page.tsx
   ============================================
   
   🎓 TEACHING NOTES:
   
   This is the MONEY page — the results dashboard.
   It's what users screenshot and share. It needs to be gorgeous.
   
   The [id] in the folder name is a DYNAMIC ROUTE parameter.
   Next.js treats anything in [brackets] as a URL parameter.
   So /validate/abc123 → params.id = "abc123"
   
   Data flow:
   1. User lands here after validation completes
   2. We fetch the validation result from Firestore using the ID
   3. Display the scorecard with animations
   
   Key components used:
   - ScoreCard: The big circular score (0-100)
   - DimensionBar: Individual dimension scores (0-10)
   - CompetitorCard: Each found competitor
   - RiskCard: Each identified risk
   ============================================ */

"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthGuard } from "@/components/AuthGuard";
import { ScoreCard } from "@/components/ScoreCard";
import { DimensionBar } from "@/components/DimensionBar";
import { CompetitorCard } from "@/components/CompetitorCard";
import { RiskCard } from "@/components/RiskCard";
import type { ValidationDoc } from "@/types";
import {
  Loader2,
  TrendingUp,
  Swords,
  AlertTriangle,
  Wrench,
  Fingerprint,
  ArrowLeft,
  Share2,
  Download,
  Lightbulb,
  Rocket,
  Radar,
} from "lucide-react";
import Link from "next/link";

/* --- The page component ---
   In Next.js 15 App Router, dynamic route params are passed
   as a Promise that you unwrap with React's `use()` hook.
   This is a new pattern in React 19 / Next.js 15. */

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();

  const [validation, setValidation] = useState<ValidationDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Fetch the validation result */
  useEffect(() => {
    const fetchResult = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/validate/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setError("Validation not found.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setValidation(data);
      } catch {
        setError("Failed to load results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, user]);

  /* Share functionality */
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // TODO: Show a toast notification
    } catch {
      // Fallback for older browsers
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-[80vh] px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back navigation */}
          <Link
            href="/validate"
            className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            New Validation
          </Link>

          {loading ? (
            /* Loading state */
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-foreground-secondary">Loading results...</p>
            </div>
          ) : error ? (
            /* Error state */
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
              <AlertTriangle className="w-10 h-10 text-danger" />
              <p className="text-foreground-secondary">{error}</p>
              <Link
                href="/validate"
                className="px-6 py-2 rounded-xl gradient-primary text-white font-medium"
              >
                Try Again
              </Link>
            </div>
          ) : validation ? (
            /* Results dashboard */
            <div className="space-y-8 animate-fade-in">
              {/* Header — idea summary + actions */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                    Validation Results
                  </h1>
                  <p className="text-foreground-secondary line-clamp-2">
                    {validation.ideaText}
                  </p>
                  <p className="text-xs text-foreground-tertiary mt-2">
                    Analyzed on{" "}
                    {new Date(validation.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2.5 rounded-xl glass text-foreground-secondary hover:text-foreground transition-colors"
                    title="Copy link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2.5 rounded-xl glass text-foreground-secondary hover:text-foreground transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Overall Score — the hero metric */}
              <div className="glass rounded-2xl p-8 flex flex-col items-center">
                <ScoreCard
                  score={validation.result.overallScore}
                  label="Overall Score"
                  size="lg"
                />
                <p className="mt-4 text-foreground-secondary text-center max-w-md">
                  {validation.result.overallScore >= 70
                    ? "This idea shows strong potential. The fundamentals are solid."
                    : validation.result.overallScore >= 40
                    ? "This idea has promise but faces significant challenges."
                    : "This idea faces major headwinds. Consider pivoting."}
                </p>
              </div>

              {/* Dimension Scores — 5 bars */}
              <div className="glass rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Score Breakdown
                </h2>
                <div className="space-y-5">
                  <DimensionBar
                    label="Market Size"
                    score={validation.result.marketSize.score}
                    analysis={validation.result.marketSize.analysis}
                    icon={TrendingUp}
                  />
                  <DimensionBar
                    label="Competition"
                    score={validation.result.competition.score}
                    analysis={validation.result.competition.analysis}
                    icon={Swords}
                  />
                  <DimensionBar
                    label="Risk Level"
                    score={validation.result.riskAssessment.score}
                    analysis={
                      validation.result.riskAssessment.biggestRisk
                    }
                    icon={AlertTriangle}
                  />
                  <DimensionBar
                    label="Feasibility"
                    score={validation.result.feasibility.score}
                    analysis={validation.result.feasibility.analysis}
                    icon={Wrench}
                  />
                  <DimensionBar
                    label="Uniqueness"
                    score={validation.result.uniqueness.score}
                    analysis={validation.result.uniqueness.analysis}
                    icon={Fingerprint}
                  />
                </div>
              </div>

              {/* Competitors */}
              {validation.result.competition.competitors.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Swords className="w-5 h-5 text-warning" />
                    Competitors Found
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {validation.result.competition.competitors.map(
                      (competitor, index) => (
                        <CompetitorCard
                          key={index}
                          name={competitor.name}
                          url={competitor.url}
                          description={competitor.description}
                          threatLevel={competitor.threatLevel}
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              {validation.result.riskAssessment.risks.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                    Risk Assessment
                  </h2>

                  {/* Biggest risk callout */}
                  <div className="glass rounded-2xl p-6 border border-danger/20 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-danger" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-danger mb-1">
                          Biggest Risk
                        </h3>
                        <p className="text-foreground-secondary">
                          {validation.result.riskAssessment.biggestRisk}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {validation.result.riskAssessment.risks.map(
                      (risk, index) => (
                        <RiskCard
                          key={index}
                          name={risk.name}
                          severity={risk.severity}
                          description={risk.description}
                          mitigation={risk.mitigation}
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className="glass rounded-2xl p-6 sm:p-8 border border-primary/20">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  Recommendation
                </h2>
                <p className="text-foreground-secondary leading-relaxed">
                  {validation.result.recommendation}
                </p>
              </div>

              {/* Next Steps */}
              {validation.result.nextSteps.length > 0 && (
                <div className="glass rounded-2xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-success" />
                    Next Steps
                  </h2>
                  <ol className="space-y-3">
                    {validation.result.nextSteps.map((step, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3"
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg gradient-primary text-white text-sm font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-foreground-secondary pt-0.5">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Validate another idea CTA */}
              <div className="text-center pt-4 pb-8">
                <Link
                  href="/validate"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl gradient-primary text-white font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(19,106,183,0.3)] hover:scale-[1.02]"
                >
                  <Radar className="w-5 h-5" />
                  Validate Another Idea
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
}
