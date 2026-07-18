"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, MapPin, Send } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea, Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import LocationPicker from "@/components/maps/location-picker";
import { aiApi, complaintsApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import type { Complaint } from "@/lib/types";

export default function ComplaintsPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ image: string; detected_waste: string; confidence: number; detections: Complaint["detections"] } | null>(null);
  const [lat, setLat] = useState(22.7196);
  const [lng, setLng] = useState(75.8577);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const { data: complaints } = useQuery({
    queryKey: ["complaints"],
    queryFn: () => complaintsApi.list().then((r) => r.data.items),
  });

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const runDetection = async () => {
    if (!file) return;
    setDetecting(true);
    try {
      const { data } = await aiApi.detectIllegalWaste(file);
      setResult(data);
      toast({ title: "Detection complete", message: `Detected: ${data.detected_waste}` });
    } catch {
      toast({ title: "Detection failed", message: "Could not run AI model" });
    } finally {
      setDetecting(false);
    }
  };

  const submitComplaint = async () => {
    if (!result) return;
    setSubmitting(true);
    try {
      await complaintsApi.create({
        image: result.image,
        detected_waste: result.detected_waste,
        confidence: result.confidence,
        location: { lat, lng, address },
        description,
        detections: result.detections ?? [],
      });
      toast({ title: "Complaint submitted!", message: "Authorities will review shortly" });
      setFile(null); setPreview(""); setResult(null); setDescription("");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
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
            <h1 className="text-2xl font-bold">Report Illegal Waste</h1>
            <p className="text-gray-400">Upload an image, run AI detection, and submit a complaint</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
                <CardDescription>Take or upload a photo of illegal waste dumping</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 transition hover:border-emerald-500/50 hover:bg-emerald-500/5">
                  <Upload className="mb-2 h-8 w-8 text-gray-500" />
                  <span className="text-sm text-gray-400">Click to upload image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </label>
                {preview && (
                  <img src={preview} alt="Preview" className="w-full rounded-xl object-cover max-h-64" />
                )}
                <Button onClick={runDetection} disabled={!file || detecting} className="w-full">
                  {detecting ? "Running AI..." : "Run AI Detection"}
                </Button>
              </CardContent>
            </Card>

            {/* AI Result */}
            <Card>
              <CardHeader>
                <CardTitle>AI Prediction</CardTitle>
                <CardDescription>Detection results with confidence scores</CardDescription>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="flex h-48 items-center justify-center text-gray-500">Upload and detect to see results</div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-emerald-500/10 p-4">
                      <p className="text-sm text-gray-400">Primary Detection</p>
                      <p className="text-2xl font-bold text-emerald-400">{result.detected_waste}</p>
                      <p className="text-sm text-gray-400">Confidence: {result.confidence}%</p>
                    </div>
                    {result.detections && result.detections.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">All Detections</p>
                        {result.detections.map((d, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                            <span>{d.class}</span>
                            <span className="text-emerald-400">{d.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Location & Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <LocationPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
                <div>
                  <Label>Address</Label>
                  <Input placeholder="Street address or landmark" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Describe the illegal dumping situation..." value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" />
                </div>
                <Button onClick={submitComplaint} disabled={submitting} className="w-full">
                  <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Complaint"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card>
            <CardHeader><CardTitle>Your Complaints</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-gray-400">
                      <th className="pb-3 pr-4">Image</th>
                      <th className="pb-3 pr-4">Waste</th>
                      <th className="pb-3 pr-4">Confidence</th>
                      <th className="pb-3 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(complaints ?? []).map((c) => (
                      <tr key={c.id} className="border-b border-white/5">
                        <td className="py-3 pr-4">
                          {c.image && <img src={getImageUrl(c.image)} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                        </td>
                        <td className="py-3 pr-4">{c.detected_waste}</td>
                        <td className="py-3 pr-4">{c.confidence}%</td>
                        <td className="py-3"><Badge status={c.status} /></td>
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
