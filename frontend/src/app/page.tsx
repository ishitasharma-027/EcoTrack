"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Leaf, ArrowRight, Recycle, Brain, MapPin, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "12K+", label: "Complaints Resolved" },
  { value: "98%", label: "AI Accuracy" },
  { value: "50+", label: "Collection Centers" },
  { value: "1M+", label: "Kg Waste Recycled" },
];

const features = [
  { icon: Brain, title: "AI Waste Detection", desc: "YOLO-powered computer vision detects illegal dumping instantly." },
  { icon: Recycle, title: "Smart Segregation", desc: "Upload waste photos and get AI-guided disposal instructions." },
  { icon: MapPin, title: "Location Tracking", desc: "Pin exact dump locations on an interactive map for authorities." },
  { icon: Shield, title: "E-Waste Recycling", desc: "Submit e-waste to verified centers and earn eco rewards." },
];

const steps = [
  { step: "01", title: "Upload", desc: "Capture or upload a photo of waste" },
  { step: "02", title: "AI Analysis", desc: "Our models classify and detect violations" },
  { step: "03", title: "Report", desc: "Submit complaints with location data" },
  { step: "04", title: "Resolve", desc: "Authorities act and you earn rewards" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen hero-gradient">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-gray-950/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">EcoTrack</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-gray-400 hover:text-white">Features</a>
            <a href="#process" className="text-sm text-gray-400 hover:text-white">Process</a>
            <a href="#ai" className="text-sm text-gray-400 hover:text-white">AI Tech</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/register"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-32 pb-20">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
              AI-Powered Waste Management
            </span>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Smart Waste Management for a{" "}
              <span className="gradient-text">Cleaner Tomorrow</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
              Report illegal dumping, get AI segregation guidance, and recycle e-waste responsibly — all in one premium platform.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg">Start Free <ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <Link href="/login"><Button variant="secondary" size="lg">View Demo</Button></Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-6">
                <p className="text-3xl font-bold text-emerald-400">{s.value}</p>
                <p className="mt-1 text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Powerful Features</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-400">Everything you need to manage waste intelligently</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass group rounded-2xl p-6 transition hover:border-emerald-500/30"
              >
                <div className="mb-4 inline-flex rounded-xl bg-emerald-500/15 p-3">
                  <f.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.step} className="relative glass rounded-2xl p-6 text-center">
                <span className="text-4xl font-bold text-emerald-500/30">{s.step}</span>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{s.desc}</p>
                {i < 3 && <div className="absolute -right-3 top-1/2 hidden h-0.5 w-6 bg-emerald-500/30 md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tech */}
      <section id="ai" className="px-6 py-20">
        <div className="mx-auto max-w-7xl glass rounded-3xl p-12">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold">Powered by YOLO AI</h2>
              <p className="mt-4 text-gray-400">
                Our dual-model AI pipeline uses Ultralytics YOLO for illegal waste detection and a ResNet18 classifier for smart segregation — delivering real-time, accurate results.
              </p>
              <ul className="mt-6 space-y-3">
                {["11 waste categories detected", "Bounding box visualization", "Confidence scoring", "Disposal guide generation"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                    <BarChart3 className="h-4 w-4 text-emerald-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="animate-float flex items-center justify-center">
              <div className="relative h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                <Brain className="h-24 w-24 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold">Ready to make a difference?</h2>
          <p className="mt-4 text-gray-400">Join thousands of citizens building cleaner cities with EcoTrack.</p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg">Create Free Account <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold">EcoTrack</span>
          </div>
          <p className="text-sm text-gray-500">© 2026 EcoTrack. Smart Waste Management Platform.</p>
        </div>
      </footer>
    </div>
  );
}
