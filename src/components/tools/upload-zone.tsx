"use client";

import { useCallback, useState } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize, generateId } from "@/lib/utils";
import { UploadedFile } from "@/types";

interface UploadZoneProps {
  accept?: Accept;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onFilesChange?: (files: UploadedFile[]) => void;
  title?: string;
  description?: string;
}

const statusIcon = {
  idle: null,
  uploading: <Loader2 className="w-4 h-4 animate-spin text-primary" />,
  processing: <Loader2 className="w-4 h-4 animate-spin text-secondary" />,
  done: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
};

export function UploadZone({
  accept,
  multiple = true,
  maxFiles = 20,
  maxSize = 100 * 1024 * 1024, // 100MB
  onFilesChange,
  title = "Drop files here or click to upload",
  description = "Supports PDF, DOCX, JPG, PNG, and more",
}: UploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "idle",
        progress: 0,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles,
    maxSize,
  });

  const removeFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const clearAll = () => {
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    onFilesChange?.([]);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive && !isDragReject ? "border-primary bg-primary/5 scale-[1.02]" : ""}
          ${isDragReject ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}
          ${!isDragActive ? "border-border hover:border-primary/50 hover:bg-muted/50" : ""}
        `}
      >
        <input {...getInputProps()} />

        <AnimatePresence>
          {isDragActive ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xl font-semibold text-primary">
                {isDragReject ? "File type not supported" : "Drop files here!"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-semibold mb-2">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max {maxFiles} files, up to {formatFileSize(maxSize)} each
                </p>
              </div>
              <Button variant="outline" size="lg" type="button">
                Browse Files
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </p>
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
                Clear all
              </Button>
            </div>

            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                {/* Preview or Icon */}
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {file.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <FileIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    {file.status !== "idle" && (
                      <div className="flex items-center gap-1 text-xs">
                        {statusIcon[file.status]}
                        <span className={
                          file.status === "done" ? "text-green-500" :
                          file.status === "error" ? "text-red-500" :
                          "text-muted-foreground"
                        }>
                          {file.status === "uploading" ? "Uploading..." :
                           file.status === "processing" ? "Processing..." :
                           file.status === "done" ? "Done" :
                           file.error || "Error"}
                        </span>
                      </div>
                    )}
                  </div>
                  {(file.status === "uploading" || file.status === "processing") && (
                    <Progress value={file.progress} className="h-1 mt-1" />
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
