"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, Menu, X, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
import { SidePanel } from "@/components/SidePanel";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
}

const publicLinks: NavLink[] = [
  { href: "/pricing", label: "Pricing" },
];

const authLinks: NavLink[] = [
  { href: "/validate", label: "Validate" },
  { href: "/history", label: "History" },
  { href: "/dashboard", label: "Dashboard" },
];

const authPages = ["/login", "/signup", "/forgot-password"];

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [userPlan, setUserPlan] = useState("free");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setTimeout(() => setMobileOpen(false), 0);
  }, [pathname]);

  // Fetch user plan for badge display
  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan || "free");
        }
      } catch {
        // Silent fail
      }
    };
    fetchPlan();
  }, [user]);

  const links = user ? authLinks : publicLinks;
  const isActive = (href: string) => pathname === href;
  const isAuthPage = authPages.includes(pathname);

  const planBadge = userPlan === "visionary" || userPlan === "elite"
    ? { icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/15" }
    : userPlan === "pro"
    ? { icon: Sparkles, color: "text-primary", bg: "bg-primary/15" }
    : null;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "backdrop-blur-xl border-b transition-all duration-300",
          scrolled
            ? "bg-background/90 border-border shadow-lg shadow-black/10"
            : "bg-background/50 border-transparent"
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group focus-ring">
            <Radar className="h-7 w-7 text-primary transition-transform duration-500 group-hover:rotate-90" />
            <span className="text-lg font-bold gradient-text">IdeaProbe</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium rounded-lg",
                  "transition-colors duration-200 focus-ring",
                  isActive(link.href)
                    ? "text-foreground"
                    : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full animate-scale-in" />
                )}
              </Link>
            ))}

            {/* Auth Actions — hidden on auth pages */}
            {!loading && !isAuthPage && (
              <div className="flex items-center gap-2 ml-4">
                {user ? (
                  <button
                    onClick={() => setSidePanelOpen(true)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    {planBadge && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${planBadge.bg} ${planBadge.color}`}>
                        <planBadge.icon className="w-3 h-3" />
                        {userPlan === "visionary" ? "Visionary" : userPlan === "elite" ? "Elite" : "Pro"}
                      </span>
                    )}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        (user.displayName || user.email || "U")[0].toUpperCase()
                      )}
                    </div>
                  </button>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm">Log In</Button>
                    </Link>
                    <Link href="/signup">
                      <Button variant="primary" size="sm">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile: Avatar + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {user && !isAuthPage && (
              <button
                onClick={() => setSidePanelOpen(true)}
                className="p-1"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (user.displayName || user.email || "U")[0].toUpperCase()
                  )}
                </div>
              </button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-white/5 transition-colors focus-ring"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden glass border-t border-border animate-slide-down">
            <div className="flex flex-col gap-1 px-4 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isActive(link.href)
                      ? "text-foreground bg-primary/10"
                      : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Auth — hidden on auth pages */}
              {!loading && !isAuthPage && (
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border">
                  {user ? (
                    <Button variant="ghost" size="sm" onClick={() => setSidePanelOpen(true)} className="justify-start gap-1.5">
                      Account Settings
                    </Button>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="ghost" size="sm" className="w-full">Log In</Button>
                      </Link>
                      <Link href="/signup">
                        <Button variant="primary" size="sm" className="w-full">Sign Up</Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Side Panel */}
      <SidePanel
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        userPlan={userPlan}
      />
    </>
  );
}
