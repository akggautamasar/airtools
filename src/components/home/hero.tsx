"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Zap, label: "Lightning Fast" },
  { icon: Shield, label: "100% Secure" },
  { icon: Globe, label: "No Install Required" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 border border-primary/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>60+ Free Tools. No Registration.</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight"
        >
          Every Tool You Need.
          <br />
          <span className="gradient-text">One Platform.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Compress, Convert, Edit and Optimize PDFs, Images and Files in Seconds.
          <br className="hidden sm:block" />
          No signup. No watermarks. 100% free.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Button size="xl" variant="gradient" asChild>
            <Link href="/tools" className="flex items-center gap-2">
              Start Using Tools
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href="#features" className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Explore Features
            </Link>
          </Button>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border border-border px-4 py-2 rounded-full"
            >
              <Icon className="w-4 h-4 text-primary" />
              {label}
            </div>
          ))}
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8">
            {/* Mock UI */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 h-7 bg-muted rounded-lg flex items-center px-3">
                <span className="text-xs text-muted-foreground">airtools.app/tools/compress-pdf</span>
              </div>
            </div>

            {/* Tool Grid Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Compress PDF", color: "bg-red-500", emoji: "📄" },
                { name: "Merge PDF", color: "bg-orange-500", emoji: "🔗" },
                { name: "Compress Image", color: "bg-green-500", emoji: "🖼️" },
                { name: "Resize Image", color: "bg-blue-500", emoji: "📐" },
                { name: "PDF to Word", color: "bg-indigo-500", emoji: "📝" },
                { name: "ZIP Maker", color: "bg-purple-500", emoji: "📦" },
                { name: "Password Gen", color: "bg-pink-500", emoji: "🔑" },
                { name: "Barcode Gen", color: "bg-cyan-500", emoji: "📊" },
              ].map((tool) => (
                <div
                  key={tool.name}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                >
                  <div className={`w-10 h-10 ${tool.color} rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                    {tool.emoji}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="absolute -left-8 top-1/2 -translate-y-1/2 hidden lg:block"
          >
            <div className="glass-card rounded-xl p-4 shadow-xl">
              <p className="text-2xl font-bold text-primary">60+</p>
              <p className="text-xs text-muted-foreground">Free Tools</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="absolute -right-8 top-1/3 hidden lg:block"
          >
            <div className="glass-card rounded-xl p-4 shadow-xl">
              <p className="text-2xl font-bold text-secondary">100%</p>
              <p className="text-xs text-muted-foreground">Browser-based</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
