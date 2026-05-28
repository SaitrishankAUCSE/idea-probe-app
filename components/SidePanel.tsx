"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  X,
  LogOut,
  Trash2,
  User,
  Crown,
  CreditCard,
  History,
  Radar,
  LayoutDashboard,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { deleteUser } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan?: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/validate", label: "Validate Idea", icon: Radar },
  { href: "/history", label: "History", icon: History },
  { href: "/pricing", label: "Plans & Pricing", icon: CreditCard },
];

const planConfig: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: "Free", color: "text-foreground-secondary", bg: "bg-white/10" },
  pro: { label: "Pro", color: "text-primary", bg: "bg-primary/15" },
  elite: { label: "Elite", color: "text-yellow-400", bg: "bg-yellow-400/15" },
  visionary: { label: "Visionary", color: "text-yellow-400", bg: "bg-yellow-400/15" },
};

export function SidePanel({ isOpen, onClose, userPlan = "free" }: SidePanelProps) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const plan = planConfig[userPlan] || planConfig.free;

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    setDeleting(true);
    try {
      await deleteUser(auth.currentUser);
      await signOut();
      onClose();
    } catch {
      alert("For security, please sign out and sign back in before deleting your account.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[101] w-[320px] max-w-[85vw] bg-[#0a0a0a] border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-lg">Account</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Section */}
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (user?.displayName || user?.email || "U")[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-xs text-foreground-tertiary truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              {/* Plan Badge */}
              <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${plan.bg} ${plan.color}`}>
                {userPlan === "visionary" || userPlan === "elite" ? (
                  <Crown className="w-3.5 h-3.5" />
                ) : userPlan === "pro" ? (
                  <Sparkles className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                {plan.label} Plan
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <item.icon className={`w-4.5 h-4.5 ${isActive ? "text-primary" : ""}`} />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className={`w-4 h-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-50 group-hover:translate-x-0 ${isActive ? "opacity-50 translate-x-0" : ""}`} />
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border space-y-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4.5 h-4.5" />
                Sign Out
              </button>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger/70 hover:text-danger hover:bg-danger/5 transition-colors"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                  Delete Account
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-danger/10 border border-danger/20"
                >
                  <p className="text-sm text-danger font-medium mb-3">
                    This will permanently delete your account and all data. This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="flex-1 py-2 px-3 rounded-lg bg-danger text-white text-sm font-bold hover:bg-danger/90 transition-colors disabled:opacity-50"
                    >
                      {deleting ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 px-3 rounded-lg glass text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
