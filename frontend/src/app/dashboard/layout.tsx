"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Brain, LayoutDashboard, Upload, Users, BarChart3,
  LogOut, Moon, Sun, Settings, ChevronRight, Bell,
  GitCompare
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { getInitials } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload", href: "/dashboard/upload", icon: Upload },
  { label: "Candidates", href: "/dashboard/candidates", icon: Users },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Compare", href: "/dashboard/compare", icon: GitCompare },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col z-40">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg animated-gradient flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-base">TalentMatch AI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? "nav-item-active" : ""}`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="px-3 pb-4 border-t border-border pt-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-8 h-8 rounded-full animated-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>

          <div className="mt-1 space-y-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="nav-item w-full"
            >
              {theme === "dark" ? (
                <><Sun className="w-4 h-4" /> Light Mode</>
              ) : (
                <><Moon className="w-4 h-4" /> Dark Mode</>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="nav-item w-full text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 ml-64">
        {/* Top bar */}
        <div className="h-16 border-b border-border bg-card/30 backdrop-blur-sm flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="text-sm text-muted-foreground">
            {navItems.find(n =>
              pathname === n.href ||
              (n.href !== "/dashboard" && pathname.startsWith(n.href))
            )?.label || "Dashboard"}
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full animated-gradient flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {getInitials(user.name)}
            </div>
          </div>
        </div>

        {/* Page content */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
