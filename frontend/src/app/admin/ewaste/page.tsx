"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ewasteApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

export default function AdminEWastePage() {
  const queryClient = useQueryClient();
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin-ewaste"],
    queryFn: () => ewasteApi.list().then((r) => r.data.items),
  });

  const verify = async (id: string, status: "approved" | "rejected", points?: number) => {
    try {
      await ewasteApi.verify(id, { status, points });
      toast({ title: status === "approved" ? "Approved & points awarded" : "Submission rejected" });
      queryClient.invalidateQueries({ queryKey: ["admin-ewaste"] });
    } catch {
      toast({ title: "Verification failed" });
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">E-Waste Verification</h1>
          <Card>
            <CardHeader><CardTitle>Pending Submissions</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : !(submissions ?? []).length ? (
                <p className="py-8 text-center text-gray-500">No submissions</p>
              ) : (
                <div className="space-y-4">
                  {submissions!.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      {s.image && <img src={getImageUrl(s.image)} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                      <div className="flex-1">
                        <p className="font-semibold">{s.waste_type}</p>
                        <p className="text-sm text-gray-400">{s.user_name} → {s.center_name}</p>
                      </div>
                      <Badge status={s.status} />
                      {s.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => verify(s.id, "approved", 100)}>Approve (+100 pts)</Button>
                          <Button size="sm" variant="destructive" onClick={() => verify(s.id, "rejected")}>Reject</Button>
                        </div>
                      )}
                      {s.status === "approved" && <span className="text-emerald-400 text-sm">+{s.points} pts</span>}
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
