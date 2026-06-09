import { Badge } from "@/components/ui/badge";
import { Tool } from "@/types";
import { FileText, Image, BookOpen, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pdf: { icon: FileText, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", label: "PDF Tool" },
  image: { icon: Image, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20", label: "Image Tool" },
  ebook: { icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20", label: "eBook Tool" },
  utility: { icon: Wrench, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", label: "Utility Tool" },
};

interface ToolHeaderProps {
  tool: Tool;
}

export function ToolHeader({ tool }: ToolHeaderProps) {
  const config = categoryConfig[tool.category] || categoryConfig.utility;
  const Icon = config.icon;

  return (
    <div className="text-center mb-10">
      <div className={cn("w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg", config.bg)}>
        <Icon className={cn("w-10 h-10", config.color)} />
      </div>
      <div className="flex items-center justify-center gap-2 mb-4">
        <Badge variant="outline" className="capitalize">{config.label}</Badge>
        {tool.popular && <Badge variant="default" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Popular</Badge>}
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold mb-4">{tool.name}</h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{tool.description}</p>
    </div>
  );
}
