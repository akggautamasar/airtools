import { MainLayout } from "@/components/layout/main-layout";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Static blog posts data
const posts: Record<string, {
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: number;
  content: string;
  tags: string[];
}> = {
  "how-to-compress-pdf-without-losing-quality": {
    title: "How to Compress PDF Without Losing Quality",
    excerpt: "Learn the best techniques to reduce PDF file size while maintaining document quality.",
    category: "PDF Guides",
    publishedAt: "2026-05-15",
    readTime: 5,
    tags: ["PDF", "Compression", "Tutorial"],
    content: `
PDF compression is essential for sharing documents efficiently. When you compress a PDF, you reduce its file size, making it easier to send via email, upload to websites, or store in the cloud.

## Why Compress PDFs?

1. **Email attachments** - Most email services have file size limits (usually 10-25MB)
2. **Faster uploads** - Smaller files upload and download quicker
3. **Storage savings** - Especially important for large document libraries
4. **Web optimization** - PDFs embedded in websites load faster when compressed

## Compression Methods

### Lossless Compression
Lossless compression reduces file size without any quality degradation. This works by removing redundant data and optimizing the internal structure of the PDF.

### Lossy Compression
Lossy compression achieves greater size reduction but may slightly reduce image quality. For documents without images, lossy compression has minimal impact on visual quality.

## Using AirTools to Compress PDF

1. Visit the **Compress PDF** tool on AirTools
2. Upload your PDF file (drag & drop or click to browse)
3. Choose your compression level (Low, Medium, or High)
4. Click "Compress PDF"
5. Download your compressed file

## Tips for Best Results

- For documents with mostly text, use **High** compression for maximum savings
- For documents with important images, use **Medium** compression to balance size and quality
- Always compare the compressed file with the original to ensure quality is acceptable
- Consider the purpose: email sharing vs. print may require different quality levels
    `,
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = posts[slug];

  if (!post) {
    return (
      <MainLayout>
        <div className="pt-24 pb-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <Link href="/blog" className="text-primary hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <article className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge variant="default" className="bg-primary/10 text-primary">{post.category}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {post.publishedAt}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime} min read
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">{post.title}</h1>
            <p className="text-xl text-muted-foreground">{post.excerpt}</p>
          </div>

          {/* Cover */}
          <div className="h-64 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-10 flex items-center justify-center">
            <div className="text-white text-6xl opacity-50">📄</div>
          </div>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {post.content.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return <h2 key={i} className="text-2xl font-bold mt-8 mb-4">{line.slice(3)}</h2>;
              }
              if (line.startsWith("### ")) {
                return <h3 key={i} className="text-xl font-semibold mt-6 mb-3">{line.slice(4)}</h3>;
              }
              if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ")) {
                return <p key={i} className="text-muted-foreground mb-2 pl-4">{line}</p>;
              }
              if (line.startsWith("- ")) {
                return <p key={i} className="text-muted-foreground mb-2 pl-4">• {line.slice(2)}</p>;
              }
              if (line.trim() === "") {
                return <div key={i} className="my-2" />;
              }
              return <p key={i} className="text-muted-foreground mb-4 leading-relaxed">{line}</p>;
            })}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-10 pt-10 border-t border-border">
            {post.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </MainLayout>
  );
}
