"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const categories = ["All", "PDF Guides", "Image Editing", "Productivity", "File Conversion"];

const posts = [
  {
    slug: "how-to-compress-pdf-without-losing-quality",
    title: "How to Compress PDF Without Losing Quality",
    excerpt: "Learn the best techniques to reduce PDF file size while maintaining document quality for sharing and storage.",
    category: "PDF Guides",
    publishedAt: "2026-05-15",
    readTime: 5,
    cover: "bg-gradient-to-br from-red-400 to-red-600",
    tags: ["PDF", "Compression", "Tutorial"],
  },
  {
    slug: "image-formats-explained-jpg-png-webp",
    title: "Image Formats Explained: JPG vs PNG vs WEBP",
    excerpt: "Understanding when to use each image format can significantly impact your website performance and visual quality.",
    category: "Image Editing",
    publishedAt: "2026-05-10",
    readTime: 7,
    cover: "bg-gradient-to-br from-green-400 to-green-600",
    tags: ["Images", "Formats", "Web"],
  },
  {
    slug: "batch-processing-files-productivity-tips",
    title: "10 Productivity Tips for Batch File Processing",
    excerpt: "Save hours of work by learning how to efficiently process multiple files at once with these proven strategies.",
    category: "Productivity",
    publishedAt: "2026-05-05",
    readTime: 6,
    cover: "bg-gradient-to-br from-blue-400 to-blue-600",
    tags: ["Productivity", "Workflow", "Tips"],
  },
  {
    slug: "complete-guide-pdf-to-word-conversion",
    title: "The Complete Guide to PDF to Word Conversion",
    excerpt: "Everything you need to know about converting PDFs to editable Word documents while preserving formatting.",
    category: "File Conversion",
    publishedAt: "2026-04-28",
    readTime: 8,
    cover: "bg-gradient-to-br from-purple-400 to-purple-600",
    tags: ["PDF", "Word", "Conversion"],
  },
  {
    slug: "optimize-images-web-performance",
    title: "Optimize Images for Lightning-Fast Web Performance",
    excerpt: "Step-by-step guide to optimizing images for the web using compression, format conversion, and lazy loading.",
    category: "Image Editing",
    publishedAt: "2026-04-20",
    readTime: 9,
    cover: "bg-gradient-to-br from-cyan-400 to-cyan-600",
    tags: ["Images", "Performance", "Web"],
  },
  {
    slug: "password-security-best-practices-2026",
    title: "Password Security Best Practices in 2026",
    excerpt: "Create and manage secure passwords with modern best practices to protect your digital accounts.",
    category: "Productivity",
    publishedAt: "2026-04-15",
    readTime: 5,
    cover: "bg-gradient-to-br from-amber-400 to-amber-600",
    tags: ["Security", "Password", "Tips"],
  },
];

export function BlogPageContent() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            AirTools <span className="gradient-text">Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Guides, tutorials, and tips for PDF management, image editing, and file productivity.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-md"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <Link href={`/blog/${filtered[0].slug}`} className="group block">
              <div className="rounded-2xl overflow-hidden border border-border bg-card hover:shadow-xl transition-all">
                <div className={`h-64 sm:h-80 ${filtered[0].cover} flex items-center justify-center`}>
                  <div className="text-white text-6xl opacity-30">📄</div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="default" className="bg-primary/10 text-primary">{filtered[0].category}</Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {filtered[0].publishedAt}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {filtered[0].readTime} min read
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors">{filtered[0].title}</h2>
                  <p className="text-muted-foreground mb-4">{filtered[0].excerpt}</p>
                  <div className="flex items-center gap-2 text-primary font-medium">
                    Read article
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.slice(1).map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/blog/${post.slug}`} className="group block h-full">
                <div className="rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all h-full flex flex-col">
                  <div className={`h-48 ${post.cover} flex items-center justify-center`}>
                    <div className="text-white text-4xl opacity-30">📄</div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime} min
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors flex-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
