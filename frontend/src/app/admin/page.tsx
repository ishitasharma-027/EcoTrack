"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, AlertTriangle, CheckCircle, Cpu, DollarSign } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { StatCard, TrendChart, PieChartWidget, BarChartWidget } from "@/components/charts/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => adminApi.analytics().then((r) => r.data),
  });

  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Analytics</h1>
            <p className="text-gray-400">Platform-wide statistics and insights</p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard title="Total Users" value={data?.total_users ?? 0} icon={Users} color="bg-blue-500/20" />
              <StatCard title="Complaints" value={data?.total_complaints ?? 0} icon={AlertTriangle} color="bg-amber-500/20" />
              <StatCard title="Pending" value={data?.pending_complaints ?? 0} icon={AlertTriangle} color="bg-red-500/20" />
              <StatCard title="Resolved" value={data?.resolved_complaints ?? 0} icon={CheckCircle} color="bg-emerald-500/20" />
              <StatCard title="E-Waste" value={data?.ewaste_submissions ?? 0} icon={Cpu} color="bg-purple-500/20" />
              <StatCard title="Revenue Saved" value={`₹${((data?.revenue_saved ?? 0) / 1000).toFixed(0)}K`} icon={DollarSign} color="bg-teal-500/20" />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Complaint Trend</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[280px]" /> : <BarChartWidget data={data?.complaint_trend ?? []} />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Complaint Status</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[280px]" /> : <PieChartWidget data={data?.status_distribution ?? []} />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Waste Distribution</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[280px]" /> : <PieChartWidget data={data?.waste_distribution ?? []} />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Weekly Activity</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[280px]" /> : <TrendChart data={data?.complaint_trend ?? []} />}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
