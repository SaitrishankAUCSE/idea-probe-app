/* ============================================
   HISTORY PAGE — app/history/page.tsx
   ============================================
   
   🎓 TEACHING NOTES:
   
   This page shows ALL past validations for the user.
   It demonstrates:
   1. Fetching a list from Firestore
   2. Empty states (what to show when there's no data)
   3. Conditional rendering based on data
   
   Empty states are CRUCIAL for UX. A blank page with "No data"
   makes users feel lost. Instead, we show a friendly message
   and a CTA to create their first validation.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthGuard } from "@/components/AuthGuard";
import Link from "next/link";
import {
  Loader2,
  Radar,
  Clock,
  TrendingUp,
  Search,
  ArrowRight,
} from "lucide-react";
import type { ValidationDoc } from "@/types";

/* Color helper for scores */
function getScoreColor(score: number): string {
  if (score >= 70) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-danger";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-success/10";
  if (score >= 40) return "bg-warning/10";
  return "bg-danger/10";
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [validations, setValidations] = useState<ValidationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setValidations(data.validations || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  /* Filter validations by search query */
  const filtered = validations.filter((v) =>
    v.ideaText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="min-h-[80vh] px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <Clock className="w-7 h-7 text-primary" />
                Validation History
              </h1>
              <p className="text-foreground-secondary mt-1">
                All your past idea validations
              </p>
            </div>
            <Link
              href="/validate"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm transition-all hover:shadow-[0_0_20px_rgba(19,106,183,0.3)] hover:scale-[1.02]"
            >
              <Radar className="w-4 h-4" />
              New Validation
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : validations.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 opacity-60">
                <Radar className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">No validations yet</h2>
              <p className="text-foreground-secondary mb-6 max-w-sm">
                Start by validating your first startup idea. It only takes 30
                seconds.
              </p>
              <Link
                href="/validate"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl gradient-primary text-white font-semibold transition-all hover:shadow-[0_0_20px_rgba(19,106,183,0.3)]"
              >
                Validate Your First Idea
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {/* Search bar */}
              {validations.length > 3 && (
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
                  <input
                    type="text"
                    placeholder="Search your validations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-background-secondary border border-border text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              )}

              {/* Validation list */}
              <div className="space-y-4">
                {filtered.map((validation, index) => (
                  <Link
                    key={validation.id}
                    href={`/validate/${validation.id}`}
                    className="block glass rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-border-hover group animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Score badge */}
                      <div
                        className={`flex-shrink-0 w-14 h-14 rounded-xl ${getScoreBg(
                          validation.result.overallScore
                        )} flex items-center justify-center`}
                      >
                        <span
                          className={`text-xl font-bold ${getScoreColor(
                            validation.result.overallScore
                          )}`}
                        >
                          {validation.result.overallScore}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {validation.ideaText}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-foreground-tertiary">
                          <span>
                            {new Date(
                              validation.createdAt
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {validation.result.competition.competitors.length}{" "}
                            competitors
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-foreground-tertiary group-hover:text-primary transition-all group-hover:translate-x-1 flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* No search results */}
              {filtered.length === 0 && searchQuery && (
                <p className="text-center text-foreground-secondary py-12">
                  No validations match &ldquo;{searchQuery}&rdquo;
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
