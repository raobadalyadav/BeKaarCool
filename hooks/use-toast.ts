"use client";

import * as React from "react";
import { toast as sonnerToast } from "sonner";

// Standalone type definitions for existing code compatibility
export type ToastProps = {
  variant?: "default" | "destructive";
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type ToasterToast = ToastProps & {
  id: string;
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();

  const { title, description, variant, action } = props;

  // Map Shadcn variant to Sonner
  if (variant === "destructive") {
    sonnerToast.error(title as string, {
      description: description as string,
      action: action ? {
        label: "Action",
        onClick: () => {} // Shim for action
      } : undefined
    });
  } else {
    sonnerToast(title as string, {
      description: description as string,
    });
  }

  return {
    id: id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (props: ToasterToast) => {}, // Shim
  };
}

function useToast() {
  return {
    toasts: [] as ToasterToast[], 
    toast,
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
