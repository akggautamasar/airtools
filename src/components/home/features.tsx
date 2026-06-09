"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Globe, Lock, RefreshCw, Layers, Sparkles, Monitor } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast Processing",
    description: "Process files in seconds with our optimized browser-based engine. No server wait times.",
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Files are processed locally in your browser. We never store or share your documents.",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description: "No installation needed. Access all 60+ tools from any device, anywhere in the world.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    icon: Lock,
    title: "End-to-End Secure",
    description: "HTTPS encryption and auto-cleanup ensure your files remain private and secure.",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    icon: RefreshCw,
    title: "Batch Processing",
    description: "Process multiple files simultaneously. Save time with our powerful batch operations.",
    color: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
  },
  {
    icon: Layers,
    title: "60+ Tools",
    description: "From PDF compression to image conversion. Everything you need in one platform.",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
  },
  {
    icon: Sparkles,
    title: "High Quality Output",
    description: "Smart algorithms maintain quality while reducing file size. Best output guaranteed.",
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/20",
  },
  {
    icon: Monitor,
    title: "Mobile Friendly",
    description: "Fully responsive design works perfectly on phones, tablets, and desktops.",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <Sparkles className="w-4 h-4" />
            Why AirTools?
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Built for the Modern
            <span className="gradient-text"> Web</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional-grade tools with a consumer-friendly experience. No bloat, no subscriptions for basic tasks.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
