"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Filter, ArrowRight, FileText, Image, BookOpen, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ALL_TOOLS, TOOL_CATEGORIES } from "@/lib/tools-data";
import { cn } from "@/lib/utils";
import { ToolCategory } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  FileText, Image, BookOpen, Wrench,
};

export function ToolsPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") as ToolCategory | null;

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">(initialCategory || "all");

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      const matchesSearch =
        !search ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase()) ||
        tool.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        activeCategory === "all" || tool.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            All <span className="gradient-text">Tools</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {ALL_TOOLS.length}+ free tools for PDF, image, eBook, and file processing. No signup required.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeCategory === "all"
                ? "bg-primary text-white shadow-md"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
            )}
          >
            <Filter className="w-4 h-4" />
            All Tools
            <Badge variant="outline" className={cn("ml-1", activeCategory === "all" && "border-white/30 text-white")}>
              {ALL_TOOLS.length}
            </Badge>
          </button>
          {TOOL_CATEGORIES.map((cat) => {
            const Icon = iconMap[cat.icon];
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as ToolCategory)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  activeCategory === cat.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                )}
              >
                <Icon className={cn("w-4 h-4", activeCategory === cat.id ? "text-white" : cat.color)} />
                {cat.name}
                <Badge variant="outline" className={cn("ml-1", activeCategory === cat.id && "border-white/30 text-white")}>
                  {cat.count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {search && (
          <p className="text-sm text-muted-foreground mb-6">
            Found {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </p>
        )}

        {/* Tool Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool, i) => (
              <motion.div
                key={tool.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              >
                <Link
                  href={`/tools/${tool.slug}`}
                  className="group block h-full p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
                      tool.category === "pdf" && "bg-red-50 dark:bg-red-950/20",
                      tool.category === "image" && "bg-green-50 dark:bg-green-950/20",
                      tool.category === "ebook" && "bg-purple-50 dark:bg-purple-950/20",
                      tool.category === "utility" && "bg-blue-50 dark:bg-blue-950/20",
                    )}>
                      <FileText className={cn("w-5 h-5", tool.color)} />
                    </div>
                    {tool.popular && (
                      <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5 group-hover:text-primary transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                    {tool.description}
                  </p>
                  <div className="flex items-center gap-1 text-primary text-xs font-medium">
                    Open tool
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tools found</h3>
            <p className="text-muted-foreground">Try a different search term or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
