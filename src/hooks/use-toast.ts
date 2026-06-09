"use client";
import { useContext } from "react";
import { ToastContext } from "@/components/ui/toaster";

export function useToast() {
  return useContext(ToastContext);
}
