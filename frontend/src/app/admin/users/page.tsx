"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => adminApi.users({ search: search || undefined }).then((r) => r.data),
  });

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await adminApi.deleteUser(id);
      toast({ title: "User deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch {
      toast({ title: "Delete failed" });
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input placeholder="Search users..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Complaints</th>
                    <th className="p-4">E-Waste</th>
                    <th className="p-4">Points</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
                  ) : (data?.items ?? []).map((u: { id: string; name: string; email: string; complaint_count: number; ewaste_count: number; wallet_points: number }) => (
                    <tr key={u.id} className="border-b border-white/5">
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-gray-400">{u.email}</td>
                      <td className="p-4">{u.complaint_count}</td>
                      <td className="p-4">{u.ewaste_count}</td>
                      <td className="p-4 text-emerald-400">{u.wallet_points}</td>
                      <td className="p-4">
                        <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
