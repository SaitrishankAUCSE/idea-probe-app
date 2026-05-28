"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const links = user ? authLinks : publicLinks;
  const isActive = (href: string) => pathname === href;
  const isAuthPage = authPages.includes(pathname);

  return (
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
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
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

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-white/5 transition-colors focus-ring"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
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
                  <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-1.5">
                    <LogOut className="h-4 w-4" />
                    Sign Out
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
  );
}
