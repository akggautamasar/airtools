"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FileText, Image, BookOpen, Wrench } from "lucide-react";
import { TOOL_CATEGORIES, ALL_TOOLS } from "@/lib/tools-data";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Image,
  BookOpen,
  Wrench,
};

export function ToolCategories() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            All the Tools You
            <span className="gradient-text"> Need</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse our complete collection of PDF, image, eBook, and utility tools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TOOL_CATEGORIES.map((category, i) => {
            const Icon = iconMap[category.icon];
            const tools = ALL_TOOLS.filter((t) => t.category === category.id).slice(0, 6);

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "group p-6 rounded-2xl border bg-card hover:shadow-xl transition-all duration-300",
                  category.borderColor
                )}
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5", category.bgColor)}>
                  <Icon className={cn("w-7 h-7", category.color)} />
                </div>

                <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{category.description}</p>

                <div className="space-y-2 mb-5">
                  {tools.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group/item"
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full", category.color.replace("text-", "bg-"))} />
                      <span className="group-hover/item:underline">{tool.name}</span>
                    </Link>
                  ))}
                  {ALL_TOOLS.filter((t) => t.category === category.id).length > 6 && (
                    <p className="text-xs text-muted-foreground pl-3.5">
                      +{ALL_TOOLS.filter((t) => t.category === category.id).length - 6} more tools
                    </p>
                  )}
                </div>

                <Link
                  href={`/tools?category=${category.id}`}
                  className={cn(
                    "inline-flex items-center gap-2 text-sm font-medium transition-colors group-hover:gap-3",
                    category.color
                  )}
                >
                  View all {category.name}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
