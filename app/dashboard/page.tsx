/* ============================================
   DASHBOARD PAGE — app/dashboard/page.tsx
   ============================================
   
   🎓 TEACHING NOTES:
   
   The user dashboard. This is where users manage their account,
   see their usage limits, and access the Stripe Customer Portal
   if they are on the Pro plan.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthGuard } from "@/components/AuthGuard";
import { User, Settings, CreditCard, Zap, Loader2, LogOut } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/usage", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleManageSubscription = async () => {
    if (!user) return;
    setLoadingPortal(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert("Failed to open customer portal");
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-[80vh] px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Settings className="w-7 h-7 text-primary" />
              Account Dashboard
            </h1>
            <p className="text-foreground-secondary mt-1">
              Manage your profile, usage, and subscription
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column: Profile Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="glass rounded-2xl p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{user?.displayName || "User"}</h2>
                <p className="text-foreground-secondary text-sm mb-6">{user?.email}</p>
                
                <button
                  onClick={signOut}
                  className="w-full py-2.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Right Column: Usage & Billing */}
            <div className="md:col-span-2 space-y-6">
              {loading ? (
                <div className="glass rounded-2xl p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <>
                  {/* Plan Details */}
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-accent" />
                      Current Plan
                    </h3>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-background-secondary border border-border mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold capitalize text-lg">
                            {profile?.plan || "Free"} Plan
                          </span>
                          {profile?.plan === "pro" && (
                            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground-secondary mt-1">
                          {profile?.plan === "pro" 
                            ? "You have unlimited validations and full access." 
                            : "You are on the free tier with limited validations."}
                        </p>
                      </div>
                      
                      {profile?.plan === "free" ? (
                        <Link
                          href="/pricing"
                          className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          Upgrade
                        </Link>
                      ) : (
                        <button
                          onClick={handleManageSubscription}
                          disabled={loadingPortal}
                          className="px-4 py-2 rounded-lg bg-background border border-border hover:border-border-hover text-sm font-medium transition-all flex items-center gap-2"
                        >
                          {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Manage Billing
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-warning" />
                      Monthly Usage
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-secondary">Validations used</span>
                        <span className="font-medium">
                          {profile?.plan === "pro" ? (
                            "Unlimited"
                          ) : (
                            `${profile?.used || 0} of ${profile?.limit || 3}`
                          )}
                        </span>
                      </div>
                      
                      {profile?.plan === "free" && (
                        <div className="h-2 w-full bg-background-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              (profile?.used || 0) >= (profile?.limit || 3) ? "bg-danger" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(((profile?.used || 0) / (profile?.limit || 3)) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
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
