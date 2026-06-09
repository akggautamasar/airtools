"use client";
import { useState } from "react";
import { Construction } from "lucide-react";
import { UploadZone } from "@/components/tools/upload-zone";
import { UploadedFile, Tool } from "@/types";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/utils";

export default function GenericImageTool({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
        <Construction className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>{tool.name}</strong> is coming soon! We are working on bringing this tool to you.
        </p>
      </div>
      <UploadZone accept={ACCEPTED_IMAGE_TYPES} multiple onFilesChange={setFiles} title={`Upload images for ${tool.name}`} />
    </div>
  );
}
