"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, History } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { aiApi, segregationApi } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import type { SegregationResult } from "@/lib/types";

const WASTE_COLORS: Record<string, string> = {
  Plastic: "#3b82f6", Glass: "#06b6d4", Paper: "#60a5fa", Metal: "#64748b",
  Cardboard: "#f59e0b", Organic: "#22c55e", Battery: "#ef4444", Shoes: "#a855f7",
  Foam: "#78716c", Garbage: "#475569", Cigarette: "#dc2626", Other: "#94a3b8",
};

export default function SegregationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SegregationResult | null>(null);

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const { data } = await aiApi.segregation(file);
      setResult(data);
      await segregationApi.saveHistory(data);
      toast({ title: "Classification complete", message: `${data.category} → ${data.disposal_bin}` });
    } catch {
      toast({ title: "Detection failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Smart Waste Segregation</h1>
              <p className="text-gray-400">Upload waste and get AI-powered disposal guidance</p>
            </div>
            <Link href="/segregation/history">
              <Button variant="secondary"><History className="h-4 w-4" /> History</Button>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Waste Image</CardTitle>
                <CardDescription>Supported: Plastic, Glass, Paper, Metal, Organic, and more</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 transition hover:border-emerald-500/50">
                  <Upload className="mb-2 h-8 w-8 text-gray-500" />
                  <span className="text-sm text-gray-400">Upload waste photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); }
                  }} />
                </label>
                {preview && <img src={preview} alt="" className="w-full rounded-xl max-h-48 object-cover" />}
                <Button onClick={handleDetect} disabled={!file || loading} className="w-full">
                  {loading ? "Analyzing..." : "Classify Waste"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {!result ? (
                <Card>
                  <CardContent className="flex h-64 items-center justify-center text-gray-500">
                    Upload an image to see classification results
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="overflow-hidden">
                    <div className="h-2" style={{ backgroundColor: result.disposal_color || WASTE_COLORS[result.category] }} />
                    <CardContent className="p-6">
                      <p className="text-sm text-gray-400">Detected Category</p>
                      <p className="text-3xl font-bold" style={{ color: result.disposal_color || WASTE_COLORS[result.category] }}>
                        {result.category}
                      </p>
                      <p className="mt-2 text-sm text-gray-400">Confidence: {result.confidence}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Disposal Guide</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold text-white" style={{ backgroundColor: result.disposal_color }}>
                          ♻
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{result.disposal_bin}</p>
                          <p className="text-sm text-gray-400">{result.disposal_guide}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
