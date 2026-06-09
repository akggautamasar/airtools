export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  color: string;
  tags: string[];
  popular?: boolean;
  new?: boolean;
}

export type ToolCategory =
  | "pdf"
  | "ebook"
  | "image"
  | "utility";

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  status: "idle" | "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
  result?: Blob;
}

export interface ProcessingOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: string;
  password?: string;
  pages?: string;
  rotation?: number;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  publishedAt: string;
  readTime: number;
  author: Author;
  coverImage: string;
  tags: string[];
}

export interface Author {
  name: string;
  avatar: string;
  bio?: string;
}

export interface PricingPlan {
  name: string;
  price: number;
  period: "month" | "year";
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface FAQ {
  question: string;
  answer: string;
}
