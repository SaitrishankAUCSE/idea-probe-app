"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthGuard } from "@/components/AuthGuard";
import { 
  User, 
  Settings, 
  Zap, 
  Loader2, 
  LogOut, 
  Sparkles,
  ArrowRight,
  Crown,
  History,
  Activity
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [usageRes, historyRes] = await Promise.all([
          fetch("/api/usage"),
          fetch("/api/history")
        ]);

        if (usageRes.ok) {
          const usageData = await usageRes.json();
          setProfile(usageData);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setRecentHistory(historyData.validations?.slice(0, 3) || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const isUnlimited = profile?.limit === "Unlimited";
  const limitValue = isUnlimited ? Infinity : (profile?.limit || 3);
  const usagePercent = profile ? Math.min(((profile.used || 0) / limitValue) * 100, 100) : 0;
  const isVisionary = profile?.plan === "visionary" || profile?.plan === "elite";
  const isPro = profile?.plan === "pro";
  const isCapped = !isUnlimited && (profile?.used || 0) >= limitValue;

  return (
    <AuthGuard>
      <div className="min-h-[85vh] px-4 py-8 sm:py-12 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto">
          {/* Header Banner */}
          <div className="mb-10 relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-border shadow-xl bg-background-secondary/50">
            <div className="absolute inset-0 bg-gradient-to-br from-background-secondary via-background to-primary/5 -z-10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-[80px] -z-10" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
                  Welcome back, {user?.displayName?.split(" ")[0] || "Founder"}
                  <Sparkles className="w-6 h-6 text-warning animate-pulse" />
                </h1>
                <p className="text-foreground-secondary mt-2 text-lg">
                  Here is a high-level overview of your IdeaProbe account.
                </p>
              </div>
              <Link 
                href="/validate"
                className="group relative inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(19,106,183,0.4)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Zap className="w-5 h-5 relative z-10" />
                <span className="relative z-10">New Validation</span>
              </Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-1 space-y-8">
              <div className="glass rounded-3xl p-8 relative overflow-hidden group">
                {/* Glow effect on hover */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-accent/30 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-5 border-4 border-background-secondary shadow-lg">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-primary" />
                      )}
                    </div>
                    {isPro && (
                      <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-600 text-white p-1.5 rounded-full border-2 border-background shadow-md">
                        <Crown className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold">{user?.displayName || "Unknown User"}</h2>
                  <p className="text-foreground-secondary mb-2">{user?.email}</p>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background-secondary text-xs font-medium text-foreground-tertiary mb-8">
                    <Settings className="w-3.5 h-3.5" />
                    Account Settings
                  </div>
                  
                  <button
                    onClick={signOut}
                    className="w-full py-3 rounded-xl border border-danger/20 text-danger hover:bg-danger hover:text-white transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-sm hover:shadow-danger/25"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Usage & History */}
            <div className="lg:col-span-2 space-y-8">
              {loading ? (
                <div className="glass rounded-3xl p-16 flex flex-col items-center justify-center min-h-[400px]">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                  <p className="text-foreground-secondary font-medium animate-pulse">Loading your dashboard...</p>
                </div>
              ) : (
                <>
                  {/* Current Plan & Usage Card */}
                  <div className="glass rounded-3xl p-8 relative overflow-hidden">
                    {(isPro || isVisionary) && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-[100px] -z-10" />
                    )}
                    
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2.5 rounded-xl ${isPro || isVisionary ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                        {isPro || isVisionary ? <Crown className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>
                      <h3 className="text-xl font-bold">Subscription & Usage</h3>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Plan Info */}
                      <div className="bg-gradient-to-br from-background to-background-secondary/50 rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -z-10" />
                        <div>
                          <div className="text-sm font-medium text-foreground-tertiary mb-1">Current Plan</div>
                          <div className="text-2xl font-bold capitalize flex items-center gap-2">
                            {profile?.plan || "Free"}
                            {(isPro || isVisionary) && <Sparkles className="w-5 h-5 text-warning" />}
                          </div>
                          <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">
                            {isPro || isVisionary
                              ? "You have unlimited access to all AI validation models and premium features." 
                              : "You are on the free tier. Upgrade to unlock unlimited validations."}
                          </p>
                        </div>
                        
                        {!isPro && !isVisionary && (
                          <Link
                            href="/pricing"
                            className="mt-5 inline-flex items-center justify-center w-full py-2.5 rounded-lg gradient-primary text-white text-sm font-bold shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5 transition-all group"
                          >
                            Upgrade to Pro
                            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        )}
                      </div>

                      {/* Usage Info */}
                      <div className="bg-gradient-to-br from-background to-background-secondary/50 rounded-2xl p-5 border border-border shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -z-10" />
                        <div className="text-sm font-medium text-foreground-tertiary mb-4">Monthly Validations</div>
                        
                        {isPro || isVisionary ? (
                          <div className="flex flex-col items-center justify-center h-full pb-4">
                            <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center mb-3 bg-background">
                              <span className="text-3xl font-bold text-primary">∞</span>
                            </div>
                            <span className="text-foreground-secondary font-medium">Unlimited Access</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-3xl font-bold text-foreground">
                                {profile?.used || 0}
                              </span>
                              <span className="text-foreground-secondary font-medium mb-1">
                                / {profile?.limit || 3} used
                              </span>
                            </div>
                            
                            {/* Thick Progress Bar */}
                            <div className="h-4 w-full bg-background rounded-full overflow-hidden border border-border mt-2 relative">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${
                                  isCapped ? "bg-danger" : "gradient-primary"
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              >
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                              </div>
                            </div>
                            
                            {isCapped && (
                              <p className="text-xs font-semibold text-danger mt-3 bg-danger/10 p-2 rounded-lg text-center">
                                You&apos;ve reached your limit!
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Validations Card */}
                  <div className="glass rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                          <History className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold">Recent Validations</h3>
                      </div>
                      
                      {recentHistory.length > 0 && (
                        <Link href="/history" className="text-sm font-semibold text-primary hover:text-primary-light transition-colors flex items-center">
                          View All <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      )}
                    </div>
                    
                    {recentHistory.length === 0 ? (
                      <div className="text-center py-10 bg-background-secondary rounded-2xl border border-border border-dashed">
                        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-sm">
                          <Zap className="w-6 h-6 text-foreground-tertiary" />
                        </div>
                        <h4 className="text-foreground font-semibold mb-1">No validations yet</h4>
                        <p className="text-foreground-secondary text-sm mb-4">Start your first idea validation to see it here.</p>
                        <Link href="/validate" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
                          Validate an Idea →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {recentHistory.map((item: any) => (
                          <Link 
                            key={item.id} 
                            href={`/validate/${item.id}`}
                            className="block p-4 rounded-2xl bg-background-secondary border border-border hover:border-primary/40 hover:bg-background-secondary/80 transition-all group"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                  {item.idea || "Untitled Idea"}
                                </h4>
                                <p className="text-xs text-foreground-tertiary mt-1">
                                  {new Date(item.createdAt).toLocaleDateString(undefined, { 
                                    month: 'short', day: 'numeric', year: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border group-hover:scale-110 transition-transform shadow-sm">
                                <ArrowRight className="w-4 h-4 text-foreground-secondary group-hover:text-primary transition-colors" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
