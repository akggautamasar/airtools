import { MainLayout } from "@/components/layout/main-layout";
import { generatePageMetadata } from "@/lib/seo";
import { BlogPageContent } from "./blog-page-content";

export const metadata = generatePageMetadata(
  "Blog",
  "Guides, tips and tutorials for PDF, image editing, productivity, and file conversion.",
  "/blog"
);

export default function BlogPage() {
  return (
    <MainLayout>
      <BlogPageContent />
    </MainLayout>
  );
}
