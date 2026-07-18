"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { adminApi, complaintsApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

export default function AdminComplaintsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [workerInputs, setWorkerInputs] = useState<Record<string, string>>({});

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["admin-complaints", statusFilter],
    queryFn: () => complaintsApi.list({ status: statusFilter || undefined, limit: 50 }).then((r) => r.data.items),
  });

  const updateStatus = async (id: string, status: string, worker?: string) => {
    try {
      await complaintsApi.update(id, { status, assigned_worker: worker, municipality: "Indore Municipal Corp" });
      toast({ title: "Complaint updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
    } catch {
      toast({ title: "Update failed" });
    }
  };

  const exportCsv = async () => {
    try {
      const res = await adminApi.exportComplaints();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "complaints.csv";
      a.click();
    } catch {
      toast({ title: "Export failed" });
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Manage Complaints</h1>
            <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
          </div>

          <div className="flex gap-4">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-gray-400">
                      <th className="p-4">Image</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Waste</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Assign Worker</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading...</td></tr>
                    ) : (complaints ?? []).map((c) => (
                      <tr key={c.id} className="border-b border-white/5">
                        <td className="p-4">
                          {c.image && <img src={getImageUrl(c.image)} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                        </td>
                        <td className="p-4">{c.user_name}</td>
                        <td className="p-4">{c.detected_waste}<br /><span className="text-xs text-gray-500">{c.confidence}%</span></td>
                        <td className="p-4 max-w-[150px] truncate text-xs">{c.location?.address || `${c.location?.lat}, ${c.location?.lng}`}</td>
                        <td className="p-4"><Badge status={c.status} /></td>
                        <td className="p-4">
                          <Input
                            placeholder="Worker name"
                            className="h-8 text-xs"
                            value={workerInputs[c.id] ?? c.assigned_worker ?? ""}
                            onChange={(e) => setWorkerInputs({ ...workerInputs, [c.id]: e.target.value })}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {["in_progress", "resolved", "rejected"].map((s) => (
                              <Button key={s} size="sm" variant="ghost" className="text-xs capitalize" onClick={() => updateStatus(c.id, s, workerInputs[c.id])}>
                                {s.replace("_", " ")}
                              </Button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
