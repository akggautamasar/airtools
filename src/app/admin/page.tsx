"use client";

import { motion } from "framer-motion";
import { Users, FileText, TrendingUp, DollarSign, BarChart3, Settings, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Total Users", value: "24,521", change: "+12.5%", up: true, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
  { label: "Files Processed", value: "1.2M", change: "+18.2%", up: true, icon: FileText, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },
  { label: "Revenue (MoM)", value: "$8,420", change: "+5.1%", up: true, icon: DollarSign, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20" },
  { label: "Active Sessions", value: "342", change: "-2.4%", up: false, icon: Activity, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
];

const topTools = [
  { name: "Compress PDF", uses: 45230, pct: 85 },
  { name: "Merge PDF", uses: 38120, pct: 72 },
  { name: "Compress Image", uses: 31450, pct: 59 },
  { name: "PDF to Word", uses: 28900, pct: 55 },
  { name: "Resize Image", uses: 22100, pct: 42 },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-6 hidden lg:flex flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl gradient-text">
          AirTools Admin
        </Link>
        <nav className="space-y-1 flex-1">
          {[
            { icon: BarChart3, label: "Dashboard", active: true },
            { icon: Users, label: "Users" },
            { icon: FileText, label: "Tool Analytics" },
            { icon: DollarSign, label: "Revenue" },
            { icon: Settings, label: "Settings" },
          ].map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="lg:ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with AirTools.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className={`flex items-center gap-1 text-sm font-medium ${stat.up ? "text-green-500" : "text-red-500"}`}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Tools */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Top Tools This Month</h2>
            <div className="space-y-4">
              {topTools.map((tool, i) => (
                <div key={tool.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{tool.name}</span>
                    <span className="text-muted-foreground">{tool.uses.toLocaleString()} uses</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${tool.pct}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: "New user signup", user: "john@example.com", time: "2 min ago" },
                { action: "PDF compressed", user: "sarah@corp.com", time: "5 min ago" },
                { action: "Bulk merge - 20 PDFs", user: "mike@startup.io", time: "12 min ago" },
                { action: "Premium plan purchase", user: "emma@design.co", time: "18 min ago" },
                { action: "1000 API calls milestone", user: "dev@app.com", time: "25 min ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.user} · {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
