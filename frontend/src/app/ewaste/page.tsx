"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, MapPin, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ewasteApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

const WASTE_TYPES = ["Mobile Phone", "Laptop", "Battery", "TV", "Monitor", "Printer", "Cable/Wires", "Other Electronics"];

export default function EWastePage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [savedImage, setSavedImage] = useState("");
  const [wasteType, setWasteType] = useState(WASTE_TYPES[0]);
  const [centerId, setCenterId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: centers } = useQuery({
    queryKey: ["centers"],
    queryFn: () => ewasteApi.getCenters().then((r) => r.data),
  });

  const { data: submissions } = useQuery({
    queryKey: ["ewaste"],
    queryFn: () => ewasteApi.list().then((r) => r.data.items),
  });

  const uploadImage = async (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    const form = new FormData();
    form.append("file", f);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/segregation`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("ecotrack_token")}` },
        body: form,
      });
      const data = await res.json();
      setSavedImage(data.image);
    } catch {
      toast({ title: "Upload failed" });
    }
  };

  const handleSubmit = async () => {
    if (!savedImage || !centerId) {
      toast({ title: "Missing fields", message: "Upload image and select a center" });
      return;
    }
    setSubmitting(true);
    try {
      await ewasteApi.submit({ image: savedImage, waste_type: wasteType, center_id: centerId });
      toast({ title: "E-Waste submitted!", message: "Pending verification at collection center" });
      setFile(null); setPreview(""); setSavedImage("");
      queryClient.invalidateQueries({ queryKey: ["ewaste"] });
    } catch {
      toast({ title: "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">E-Waste Management</h1>
            <p className="text-gray-400">Submit electronic waste to authorized collection centers</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit E-Waste</CardTitle>
                <CardDescription>Upload photo, select type and collection center</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:border-emerald-500/50">
                  <Upload className="mb-2 h-6 w-6 text-gray-500" />
                  <span className="text-sm text-gray-400">Upload e-waste photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </label>
                {preview && <img src={preview} alt="" className="w-full rounded-xl max-h-40 object-cover" />}
                <div>
                  <Label>Waste Type</Label>
                  <Select value={wasteType} onChange={(e) => setWasteType(e.target.value)} className="mt-1.5">
                    {WASTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Collection Center</Label>
                  <Select value={centerId} onChange={(e) => setCenterId(e.target.value)} className="mt-1.5">
                    <option value="">Select center...</option>
                    {(centers ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name} – {c.area}</option>
                    ))}
                  </Select>
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? "Submitting..." : "Submit E-Waste"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Collection Centers</CardTitle></CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {(centers ?? []).map((c) => (
                  <div key={c.id} className="rounded-xl bg-white/5 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-sm text-emerald-400">{c.area}</p>
                      </div>
                      <a href={c.map_link} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.address}</p>
                    <p className="text-xs text-gray-500">{c.phone} · {c.opening_time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Your Submissions</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-gray-400">
                      <th className="pb-3 pr-4">Image</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">Center</th>
                      <th className="pb-3 pr-4">Points</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(submissions ?? []).map((s) => (
                      <tr key={s.id} className="border-b border-white/5">
                        <td className="py-3 pr-4">
                          {s.image && <img src={getImageUrl(s.image)} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                        </td>
                        <td className="py-3 pr-4">{s.waste_type}</td>
                        <td className="py-3 pr-4">{s.center_name}</td>
                        <td className="py-3 pr-4 text-emerald-400">{s.points || "—"}</td>
                        <td className="py-3"><Badge status={s.status} /></td>
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
