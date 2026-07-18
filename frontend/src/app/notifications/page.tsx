"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list().then((r) => r.data),
  });

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {(data?.unread_count ?? 0) > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {data?.unread_count ? `${data.unread_count} unread` : "All caught up"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.items ?? []).length === 0 ? (
                <p className="py-8 text-center text-gray-500">No notifications yet</p>
              ) : (
                data?.items.map((n) => (
                  <div key={n.id} className={`rounded-xl p-4 ${n.read ? "bg-white/5" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{n.title}</p>
                        <p className="mt-1 text-sm text-gray-400">{n.message}</p>
                      </div>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">{formatDate(n.date)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
