"use client";

import { useForm } from "react-hook-form";
import { useTheme } from "next-themes";
import { Lock, Moon, Sun } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { register, handleSubmit } = useForm<{ current_password: string; new_password: string }>();

  const onPasswordChange = async (data: { current_password: string; new_password: string }) => {
    try {
      await authApi.changePassword(data);
      toast({ title: "Password changed successfully" });
    } catch {
      toast({ title: "Password change failed", message: "Check your current password" });
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold">Settings</h1>

          <Card>
            <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span>Dark Mode</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  Toggle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onPasswordChange)} className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <Input type="password" className="mt-1.5" {...register("current_password", { required: true })} />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input type="password" className="mt-1.5" {...register("new_password", { required: true, minLength: 6 })} />
                </div>
                <Button type="submit">Update Password</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
