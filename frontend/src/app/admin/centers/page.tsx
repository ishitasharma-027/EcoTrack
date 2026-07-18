"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ewasteApi } from "@/lib/api";

export default function AdminCentersPage() {
  const { data: centers, isLoading } = useQuery({
    queryKey: ["centers"],
    queryFn: () => ewasteApi.getCenters().then((r) => r.data),
  });

  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Collection Centers</h1>
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(centers ?? []).map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <p className="text-sm text-emerald-400">{c.area}</p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-400">
                    <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {c.address}</p>
                    <p>{c.phone}</p>
                    <p>{c.opening_time}</p>
                    <a href={c.map_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:underline">
                      View on Map <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
