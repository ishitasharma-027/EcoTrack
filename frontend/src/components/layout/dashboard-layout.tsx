"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, AlertTriangle, Recycle, Cpu, Wallet, User, Settings,
  Bell, LogOut, Leaf, Menu, X, Shield,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

const citizenLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/complaints", label: "Report Waste", icon: AlertTriangle },
  { href: "/segregation", label: "Segregation", icon: Recycle },
  { href: "/ewaste", label: "E-Waste", icon: Cpu },
  { href: "/wallet", label: "Eco Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Analytics", icon: LayoutDashboard },
  { href: "/admin/complaints", label: "Complaints", icon: AlertTriangle },
  { href: "/admin/ewaste", label: "E-Waste Verify", icon: Cpu },
  { href: "/admin/users", label: "Users", icon: User },
  { href: "/admin/centers", label: "Centers", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list().then((r) => r.data),
    refetchInterval: 30000,
  });

  const links = user?.role === "admin" ? adminLinks : citizenLinks;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0a0f0d]">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-gray-950/80 backdrop-blur-xl transition-transform lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">EcoTrack</span>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/5 p-3">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-white/10 bg-gray-950/60 px-6 backdrop-blur-xl">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5 text-gray-400" />
          </button>
          <div className="flex-1" />
          <Link href="/notifications" className="relative rounded-xl p-2 hover:bg-white/5">
            <Bell className="h-5 w-5 text-gray-400" />
            {(notifData?.unread_count ?? 0) > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {notifData!.unread_count}
              </span>
            )}
          </Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
