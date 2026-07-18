"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { segregationApi } from "@/lib/api";
import { formatDate, getImageUrl } from "@/lib/utils";

export default function SegregationHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["segregation-history"],
    queryFn: () => segregationApi.getHistory().then((r) => r.data.items),
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Segregation History</h1>
          <Card>
            <CardHeader><CardTitle>Past Predictions</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : !data?.length ? (
                <p className="py-8 text-center text-gray-500">No history yet</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.map((item, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      {item.image && <img src={getImageUrl(item.image)} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />}
                      <p className="font-semibold">{item.category}</p>
                      <p className="text-sm text-emerald-400">{item.disposal_bin}</p>
                      <p className="text-xs text-gray-500">{item.confidence}% confidence</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
