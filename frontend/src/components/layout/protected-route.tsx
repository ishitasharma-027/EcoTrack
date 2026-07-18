"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/badge";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && adminOnly && user.role !== "admin") router.replace("/dashboard");
  }, [user, loading, router, adminOnly]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f0d]">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user || (adminOnly && user.role !== "admin")) return null;
  return <>{children}</>;
}
