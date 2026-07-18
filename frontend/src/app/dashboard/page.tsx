"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Clock, Wallet, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { StatCard, TrendChart, PieChartWidget } from "@/components/charts/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Skeleton } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardApi } from "@/lib/api";
import { formatDate, getImageUrl } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data),
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-400">Overview of your waste management activity</p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Complaints" value={data?.complaints_total ?? 0} icon={AlertTriangle} color="bg-amber-500/20" />
              <StatCard title="Resolved" value={data?.complaints_resolved ?? 0} icon={CheckCircle} color="bg-emerald-500/20" />
              <StatCard title="Pending" value={data?.complaints_pending ?? 0} icon={Clock} color="bg-blue-500/20" />
              <StatCard title="Wallet Points" value={data?.wallet_points ?? 0} icon={Wallet} color="bg-purple-500/20" subtitle="Eco rewards" />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Complaint Trend</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[280px]" /> : <TrendChart data={data?.complaint_trend ?? []} />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Waste Category Distribution</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[280px]" /> : <PieChartWidget data={data?.waste_distribution ?? []} />}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Complaints</CardTitle>
                <Link href="/complaints"><Button variant="ghost" size="sm">View all</Button></Link>
              </CardHeader>
              <CardContent>
                {(data?.recent_complaints ?? []).length === 0 ? (
                  <p className="py-8 text-center text-gray-500">No complaints yet. Report illegal waste!</p>
                ) : (
                  <div className="space-y-3">
                    {data?.recent_complaints.map((c) => (
                      <div key={c.id} className="flex items-center gap-4 rounded-xl bg-white/5 p-3">
                        {c.image && <img src={getImageUrl(c.image)} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                        <div className="flex-1">
                          <p className="font-medium">{c.detected_waste}</p>
                          <p className="text-xs text-gray-500">{formatDate(c.date)}</p>
                        </div>
                        <Badge status={c.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { href: "/complaints", label: "Report Illegal Waste", icon: AlertTriangle },
                  { href: "/segregation", label: "Segregate Waste", icon: CheckCircle },
                  { href: "/ewaste", label: "Submit E-Waste", icon: Wallet },
                ].map((action) => (
                  <Link key={action.href} href={action.href}>
                    <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 rounded-xl bg-white/5 p-4 transition hover:bg-emerald-500/10">
                      <action.icon className="h-5 w-5 text-emerald-400" />
                      <span className="flex-1 text-sm font-medium">{action.label}</span>
                      <ArrowRight className="h-4 w-4 text-gray-500" />
                    </motion.div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
