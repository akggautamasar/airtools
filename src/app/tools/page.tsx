import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ToolsPageContent } from "./tools-page-content";
import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata(
  "All Tools",
  "Browse 60+ free online tools for PDF, image, eBook, and file processing. No registration required.",
  "/tools"
);

export default function ToolsPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="min-h-screen" />}>
        <ToolsPageContent />
      </Suspense>
    </MainLayout>
  );
}
