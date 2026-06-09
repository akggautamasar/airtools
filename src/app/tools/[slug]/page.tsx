import { notFound } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { ToolHeader } from "@/components/tools/tool-header";
import { RelatedTools } from "@/components/tools/related-tools";
import { ToolFAQ } from "@/components/tools/tool-faq";
import { DynamicToolProcessor } from "./dynamic-tool-processor";
import { ALL_TOOLS, getToolBySlug } from "@/lib/tools-data";
import { generateToolMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return generateToolMetadata(tool);
}

export async function generateStaticParams() {
  return ALL_TOOLS.map((tool) => ({ slug: tool.slug }));
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) notFound();

  return (
    <MainLayout>
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ToolHeader tool={tool} />
          <DynamicToolProcessor tool={tool} />
          <ToolFAQ tool={tool} />
          <RelatedTools tool={tool} />
        </div>
      </div>
    </MainLayout>
  );
}
