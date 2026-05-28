"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
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
  Radar as RadarIcon,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { motion, Variants } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [validation, setValidation] = useState<ValidationDoc | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!user) return;
      try {
        const [res, usageRes] = await Promise.all([
          fetch(`/api/validate/${id}`),
          fetch(`/api/usage`)
        ]);

        if (!res.ok) {
          setError("Validation not found.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setValidation(data);
        
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          setUserPlan(usageData.plan);
        }
      } catch {
        setError("Failed to load results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, user]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    } catch {
      // Fallback
    }
  };

  const handleDownloadPDF = async () => {
    if (userPlan === "free") {
      alert("PDF Reports are a Pro/Elite feature. Upgrade to download!");
      router.push("/pricing");
      return;
    }
    
    setGeneratingPDF(true);
    const element = document.getElementById("report-content");
    if (!element) {
      setGeneratingPDF(false);
      return;
    }
    
    try {
      // Add a slight delay to ensure fonts/charts are fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#000000" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`IdeaProbe-Report-${id}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleDownloadCSV = () => {
    if (userPlan === "free") {
      alert("CSV Export is a Pro/Elite feature. Upgrade to unlock!");
      router.push("/pricing");
      return;
    }
    if (!validation) return;
    const r = validation.result;
    
    // Compile competitors & risks CSV
    const csvLines = [];
    
    // Section 1: Competitors
    csvLines.push("COMPETITORS");
    csvLines.push("Name,URL,Description,Threat Level");
    r.competition.competitors.forEach(c => {
      csvLines.push([
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.url.replace(/"/g, '""')}"`,
        `"${c.description.replace(/"/g, '""')}"`,
        `"${c.threatLevel}"`
      ].join(","));
    });
    
    csvLines.push("");
    csvLines.push("RISK ASSESSMENT");
    csvLines.push("Name,Severity,Description,Mitigation");
    r.riskAssessment.risks.forEach(risk => {
      csvLines.push([
        `"${risk.name.replace(/"/g, '""')}"`,
        `"${risk.severity}"`,
        `"${risk.description.replace(/"/g, '""')}"`,
        `"${risk.mitigation.replace(/"/g, '""')}"`
      ].join(","));
    });

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IdeaProbe-Export-${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const prepareChartData = () => {
    if (!validation) return [];
    const r = validation.result;
    return [
      { subject: "Market Size", A: r.marketSize.score * 10, fullMark: 100 },
      { subject: "Competition", A: r.competition.score * 10, fullMark: 100 },
      { subject: "Risk Level", A: r.riskAssessment.score * 10, fullMark: 100 },
      { subject: "Feasibility", A: r.feasibility.score * 10, fullMark: 100 },
      { subject: "Uniqueness", A: r.uniqueness.score * 10, fullMark: 100 },
      // Fallback for older documents missing scalability
      { subject: "Scalability", A: (r.scalability?.score || 5) * 10, fullMark: 100 },
    ];
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
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-foreground-secondary">Loading results...</p>
            </div>
          ) : error ? (
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
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8" 
              id="report-content"
            >
              {/* Header */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 rounded-2xl bg-background/50">
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
                <div className="flex items-center gap-2" data-html2canvas-ignore>
                  <button
                    onClick={handleShare}
                    className="p-2.5 rounded-xl glass text-foreground-secondary hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  <button
                    onClick={handleDownloadCSV}
                    className="p-2.5 rounded-xl glass text-foreground-secondary hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {userPlan !== "free" ? "CSV Export" : "CSV Export (Pro)"}
                    </span>
                    {userPlan === "free" && <Lock className="w-3 h-3 ml-1" />}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={generatingPDF}
                    className="p-2.5 rounded-xl gradient-primary text-white hover:opacity-90 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span className="hidden sm:inline">
                      {userPlan !== "free" ? "PDF Report" : "PDF Report (Pro)"}
                    </span>
                    {userPlan === "free" && <Lock className="w-3 h-3 ml-1" />}
                  </button>
                </div>
              </motion.div>

              {/* Overall Score + Archetype */}
              <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center">
                  <ScoreCard
                    score={validation.result.overallScore}
                    label="Overall Score"
                    size="lg"
                  />
                  <p className="mt-4 text-foreground-secondary text-center max-w-[250px] text-sm">
                    {validation.result.whyThisScore || (validation.result.overallScore >= 70
                      ? "This idea shows strong potential. The fundamentals are solid."
                      : validation.result.overallScore >= 40
                      ? "This idea has promise but faces significant challenges."
                      : "This idea faces major headwinds. Consider pivoting.")}
                  </p>
                </div>
                
                {/* Radar Chart */}
                <div className="glass rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <h3 className="font-semibold text-foreground-secondary mb-2">Analysis Radar</h3>
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={prepareChartData()}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--foreground-secondary)', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="Score"
                          dataKey="A"
                          stroke="var(--primary)"
                          fill="var(--primary)"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Startup Archetype (NEW) */}
              {validation.result.startupArchetype && (
                <motion.div variants={itemVariants} className="glass rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap flex-1 gap-6 sm:justify-between w-full">
                    <div>
                      <p className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">Archetype</p>
                      <p className="font-semibold text-primary-light">{validation.result.startupArchetype.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">Execution Difficulty</p>
                      <p className="font-semibold">{validation.result.startupArchetype.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">Est. Time to MVP</p>
                      <p className="font-semibold">{validation.result.startupArchetype.timeToMvp}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">Monetization</p>
                      <p className="font-semibold text-success">{validation.result.startupArchetype.monetizationPotential}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Opportunities (NEW) */}
              {validation.result.opportunities && validation.result.opportunities.list.length > 0 && (
                <motion.div variants={itemVariants} className="glass rounded-2xl p-6 sm:p-8 border border-success/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-[50px] pointer-events-none" />
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    Opportunities & Niches
                  </h2>
                  <p className="text-foreground-secondary mb-6 relative z-10">
                    {validation.result.opportunities.analysis}
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-3 relative z-10">
                    {validation.result.opportunities.list.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm bg-background/50 rounded-lg p-3 border border-border">
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {validation.result.pivotSuggestions && validation.result.pivotSuggestions.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-border/50 relative z-10">
                      <h3 className="text-lg font-semibold mb-4 text-primary-light">Actionable Pivot Suggestions</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {validation.result.pivotSuggestions.map((pivot, idx) => (
                          <div key={idx} className="glass-light rounded-xl p-4 border border-primary/20">
                            <Lightbulb className="w-5 h-5 text-warning mb-2" />
                            <p className="text-sm text-foreground-secondary">{pivot}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Dimension Scores */}
              <motion.div variants={itemVariants} className="glass rounded-2xl p-6 sm:p-8">
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
                    analysis={validation.result.riskAssessment.biggestRisk}
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
                  {/* Scalability for newer validations */}
                  {validation.result.scalability && (
                    <DimensionBar
                      label="Scalability"
                      score={validation.result.scalability.score}
                      analysis={validation.result.scalability.analysis}
                      icon={TrendingUp}
                    />
                  )}
                </div>
              </motion.div>

              {/* Competitors */}
              {validation.result.competition.competitors.length > 0 && (
                <motion.div variants={itemVariants}>
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
                </motion.div>
              )}

              {/* Risk Assessment */}
              {validation.result.riskAssessment.risks.length > 0 && (
                <motion.div variants={itemVariants}>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                    Risk Assessment
                  </h2>
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
                </motion.div>
              )}

              {/* Recommendation */}
              <motion.div variants={itemVariants} className="glass rounded-2xl p-6 sm:p-8 border border-primary/20">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  Recommendation
                </h2>
                <p className="text-foreground-secondary leading-relaxed">
                  {validation.result.recommendation}
                </p>
              </motion.div>

              {/* SWOT Analysis (Elite Exclusive) */}
              {validation.result.swotAnalysis && (
                <motion.div variants={itemVariants} className="space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Deep-Dive SWOT Analysis (Elite)
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="glass rounded-2xl p-6 border-l-4 border-l-success">
                      <h3 className="font-bold text-success text-lg mb-3">
                        Strengths
                      </h3>
                      <ul className="space-y-2 text-sm text-foreground-secondary list-disc pl-4">
                        {validation.result.swotAnalysis.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="glass rounded-2xl p-6 border-l-4 border-l-danger">
                      <h3 className="font-bold text-danger text-lg mb-3">
                        Weaknesses
                      </h3>
                      <ul className="space-y-2 text-sm text-foreground-secondary list-disc pl-4">
                        {validation.result.swotAnalysis.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Opportunities */}
                    <div className="glass rounded-2xl p-6 border-l-4 border-primary">
                      <h3 className="font-bold text-primary text-lg mb-3">
                        Opportunities
                      </h3>
                      <ul className="space-y-2 text-sm text-foreground-secondary list-disc pl-4">
                        {validation.result.swotAnalysis.opportunities.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Threats */}
                    <div className="glass rounded-2xl p-6 border-l-4 border-warning">
                      <h3 className="font-bold text-warning text-lg mb-3">
                        Threats
                      </h3>
                      <ul className="space-y-2 text-sm text-foreground-secondary list-disc pl-4">
                        {validation.result.swotAnalysis.threats.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Next Steps */}
              {validation.result.nextSteps.length > 0 && (
                <motion.div variants={itemVariants} className="glass rounded-2xl p-6 sm:p-8">
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
                </motion.div>
              )}

              {/* Validate another idea CTA */}
              <motion.div variants={itemVariants} className="text-center pt-4 pb-8" data-html2canvas-ignore>
                <Link
                  href="/validate"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl gradient-primary text-white font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(19,106,183,0.3)] hover:scale-[1.02]"
                >
                  <RadarIcon className="w-5 h-5" />
                  Validate Another Idea
                </Link>
              </motion.div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
}
