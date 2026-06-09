"use client";
import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "info";
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}

export function Toaster() {
  const { toasts, removeToast } = React.useContext(ToastContext);

  return (
    <ToastPrimitive.Provider>
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          className={cn(
            "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
            toast.variant === "success" && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
            toast.variant === "error" && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
            toast.variant === "info" && "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
            (!toast.variant || toast.variant === "default") && "border bg-card"
          )}
          open={true}
          onOpenChange={(open) => !open && removeToast(toast.id)}
        >
          <div className="flex items-start gap-3">
            {toast.variant === "success" && <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />}
            {toast.variant === "error" && <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />}
            {toast.variant === "info" && <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />}
            <div className="grid gap-1">
              <ToastPrimitive.Title className="text-sm font-semibold">{toast.title}</ToastPrimitive.Title>
              {toast.description && (
                <ToastPrimitive.Description className="text-xs text-muted-foreground">
                  {toast.description}
                </ToastPrimitive.Description>
              )}
            </div>
          </div>
          <ToastPrimitive.Close
            onClick={() => removeToast(toast.id)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed top-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2" />
    </ToastPrimitive.Provider>
  );
}
