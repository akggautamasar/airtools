import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { Tool } from "@/types";
import { getRelatedTools } from "@/lib/tools-data";

interface RelatedToolsProps {
  tool: Tool;
}

export function RelatedTools({ tool }: RelatedToolsProps) {
  const related = getRelatedTools(tool, 6);

  if (related.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6">Related Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {related.map((relatedTool) => (
          <Link
            key={relatedTool.slug}
            href={`/tools/${relatedTool.slug}`}
            className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium group-hover:text-primary transition-colors">{relatedTool.name}</p>
              <p className="text-xs text-muted-foreground truncate">{relatedTool.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
