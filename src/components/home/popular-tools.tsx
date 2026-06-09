"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star, FileDown, FilePlus2, FileText, ImageDown, Maximize2, Crop, Key, Lock } from "lucide-react";
import { POPULAR_TOOLS } from "@/lib/tools-data";
import { Badge } from "@/components/ui/badge";

const iconMap: Record<string, React.ElementType> = {
  FileDown, FilePlus2, FileText, ImageDown, Maximize2, Crop, Key, Lock,
};

const categoryColors: Record<string, string> = {
  pdf: "bg-red-50 dark:bg-red-950/20 text-red-600",
  image: "bg-green-50 dark:bg-green-950/20 text-green-600",
  ebook: "bg-purple-50 dark:bg-purple-950/20 text-purple-600",
  utility: "bg-blue-50 dark:bg-blue-950/20 text-blue-600",
};

const categoryIconBg: Record<string, string> = {
  pdf: "bg-red-100 dark:bg-red-900/30",
  image: "bg-green-100 dark:bg-green-900/30",
  ebook: "bg-purple-100 dark:bg-purple-900/30",
  utility: "bg-blue-100 dark:bg-blue-900/30",
};

export function PopularTools() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-amber-200 dark:border-amber-800">
              <Star className="w-4 h-4 fill-current" />
              Most Popular
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold">
              Top <span className="gradient-text">Tools</span>
            </h2>
          </div>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
          >
            View all tools
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {POPULAR_TOOLS.map((tool, i) => {
            const IconComp = iconMap[tool.icon] || FileText;
            return (
              <motion.div
                key={tool.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link
                  href={`/tools/${tool.slug}`}
                  className="group block p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${categoryIconBg[tool.category]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComp className={`w-6 h-6 ${tool.color}`} />
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{tool.category}</Badge>
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-primary text-xs font-medium">
                    Use tool
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
