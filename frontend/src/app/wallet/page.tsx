"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wallet, Gift, Leaf } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { walletApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

const REWARD_ICONS: Record<string, string> = {
  amazon: "🛒", flipkart: "🛍️", movie: "🎬", metro: "🚇",
  plant: "🌱", coffee: "☕", donation: "💚",
};

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { data: wallet } = useQuery({ queryKey: ["wallet"], queryFn: () => walletApi.get().then((r) => r.data) });
  const { data: rewards } = useQuery({ queryKey: ["rewards"], queryFn: () => walletApi.getRewards().then((r) => r.data) });

  const redeem = async (rewardId: string, name: string, cost: number) => {
    if ((wallet?.points ?? 0) < cost) {
      toast({ title: "Insufficient points", message: `Need ${cost} points` });
      return;
    }
    try {
      await walletApi.redeem(rewardId);
      toast({ title: "Reward redeemed!", message: name });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    } catch {
      toast({ title: "Redemption failed" });
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Eco Wallet</h1>

          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 shadow-2xl">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-2 text-emerald-100">
                <Wallet className="h-5 w-5" /> Eco Points Balance
              </div>
              <motion.p
                key={wallet?.points}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-5xl font-bold text-white"
              >
                {wallet?.points ?? 0}
              </motion.p>
              <p className="mt-2 text-sm text-emerald-100/80">Earn points by recycling e-waste responsibly</p>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" /> Redeem Rewards</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {(rewards ?? []).map((r) => (
                  <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-2xl">{REWARD_ICONS[r.icon] || "🎁"}</div>
                    <p className="mt-2 font-semibold">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-emerald-400">{r.points_cost} pts</span>
                      <Button size="sm" variant="outline" onClick={() => redeem(r.id, r.name, r.points_cost)}>Redeem</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {(wallet?.transactions ?? []).slice().reverse().map((t, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                      </div>
                      <span className={`font-semibold ${t.type === "credit" ? "text-emerald-400" : "text-red-400"}`}>
                        {t.type === "credit" ? "+" : "-"}{t.amount}
                      </span>
                    </div>
                  ))}
                  {!wallet?.transactions?.length && (
                    <p className="py-8 text-center text-gray-500">No transactions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
