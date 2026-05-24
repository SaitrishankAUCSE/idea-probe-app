"use client";

/**
 * ============================================
 * AUTH GUARD — Protects authenticated routes
 * ============================================
 *
 * WHAT THIS DOES:
 * Wraps any page that requires authentication. It has three states:
 * 1. **Loading** → shows a shimmer skeleton (auth state resolving)
 * 2. **Not authenticated** → redirects to /login
 * 3. **Authenticated** → renders children
 *
 * DESIGN DECISIONS:
 * 1. **Shimmer loading state** — instead of a blank screen while Firebase
 *    resolves auth, we show a beautiful skeleton with the `.shimmer` class.
 *    This prevents layout shift and feels intentional.
 *
 * 2. **Redirect via next/navigation** — `redirect()` is the App Router way
 *    to do server-style redirects from client components. However, since
 *    we're in a client component with `useAuth()`, we use `useEffect` +
 *    `router.replace()` for a clean client-side redirect that doesn't
 *    flash content.
 *
 * 3. **Wrapper pattern** — AuthGuard doesn't render its own layout.
 *    It either renders children or a loading state. This makes it
 *    composable: wrap any page, any layout, any component tree.
 *
 * USAGE:
 *   <AuthGuard>
 *     <DashboardPage />
 *   </AuthGuard>
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Radar } from "lucide-react";

/* ── Props ─────────────────────────────────── */

interface AuthGuardProps {
  children: React.ReactNode;
}

/* ── Component ─────────────────────────────── */

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  /*
   * WHY useEffect for redirect?
   * We can't call `redirect()` (from next/navigation) conditionally in
   * a client component — it throws during render. Instead, we use
   * `router.replace()` inside useEffect, which runs after the render
   * cycle completes.
   *
   * `replace` (not `push`) ensures the login page replaces the protected
   * route in history — pressing Back won't loop back to the guard.
   */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  /* ── Loading State: Shimmer Skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        {/*
         * Animated logo — gives the user something to look at while
         * auth resolves (usually < 500ms, but can be longer on slow networks).
         */}
        <div className="flex items-center gap-2 animate-pulse">
          <Radar className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold gradient-text">
            IdeaProbe
          </span>
        </div>

        {/*
         * Shimmer skeletons — mimic the shape of the page that's loading.
         * Three blocks of varying width simulate content hierarchy.
         */}
        <div className="w-full max-w-md space-y-4">
          <div className="h-8 rounded-xl shimmer" />
          <div className="h-4 w-3/4 rounded-lg shimmer" />
          <div className="h-4 w-1/2 rounded-lg shimmer" />
          <div className="h-32 rounded-2xl shimmer mt-6" />
          <div className="h-10 w-full rounded-xl shimmer mt-4" />
        </div>
      </div>
    );
  }

  /* ── Not authenticated: show nothing while redirect happens ──
   * We return null here because the useEffect above is already
   * redirecting. Rendering anything would cause a content flash.
   */
  if (!user) {
    return null;
  }

  /* ── Authenticated: render the protected content ── */
  return <>{children}</>;
}
