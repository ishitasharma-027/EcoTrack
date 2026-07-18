"use client";

import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { User, Mail, Phone, AlertTriangle, Cpu, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { authApi, complaintsApi, ewasteApi, walletApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { register, handleSubmit } = useForm({ defaultValues: { name: user?.name, phone: user?.phone || "" } });

  const { data: complaints } = useQuery({ queryKey: ["complaints-count"], queryFn: () => complaintsApi.list().then((r) => r.data.total) });
  const { data: ewaste } = useQuery({ queryKey: ["ewaste-count"], queryFn: () => ewasteApi.list().then((r) => r.data.total) });
  const { data: wallet } = useQuery({ queryKey: ["wallet"], queryFn: () => walletApi.get().then((r) => r.data) });

  const onSave = async (data: { name?: string; phone?: string }) => {
    try {
      await authApi.updateProfile({ name: data.name, phone: data.phone });
      await refreshUser();
      toast({ title: "Profile updated" });
    } catch {
      toast({ title: "Update failed" });
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold">Profile</h1>

          <Card>
            <CardContent className="flex items-center gap-6 p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-gray-400">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs text-emerald-400 capitalize">{user?.role}</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: AlertTriangle, label: "Complaints", value: complaints ?? 0 },
              { icon: Cpu, label: "E-Waste", value: ewaste ?? 0 },
              { icon: Wallet, label: "Points", value: wallet?.points ?? 0 },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex flex-col items-center p-4">
                  <s.icon className="h-5 w-5 text-emerald-400" />
                  <p className="mt-2 text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input className="pl-10" {...register("name")} />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input className="pl-10" value={user?.email} disabled />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input className="pl-10" {...register("phone")} />
                  </div>
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
