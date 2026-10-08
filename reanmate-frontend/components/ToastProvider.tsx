"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "success" | "error" | "info";

export type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
  duration: number;
};

type ToastInput = {
  kind: ToastKind;
  message: string;
  duration?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  show: (input: ToastInput) => void;
  dismiss: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastKind, number> = {
  success: 3800,
  error: 4800,
  info: 4500,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((input: ToastInput) => {
    const toast: Toast = {
      id: crypto.randomUUID(),
      kind: input.kind,
      message: input.message,
      duration: input.duration ?? DEFAULT_DURATION[input.kind],
    };
    setToasts((prev) => [...prev.slice(-2), toast]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      show,
      dismiss,
      success: (message) => show({ kind: "success", message }),
      error: (message) => show({ kind: "error", message }),
      info: (message) => show({ kind: "info", message }),
    }),
    [toasts, show, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[80] flex flex-col items-center gap-2 px-4"
      style={{ top: "calc(4.75rem + env(safe-area-inset-top))" }}
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const palette =
    toast.kind === "success"
      ? "bg-success-soft text-success ring-success/20"
      : toast.kind === "error"
        ? "bg-error-soft text-error ring-error/20"
        : "bg-primary-dark text-white ring-white/10";

  const mark = toast.kind === "success" ? "✓" : toast.kind === "error" ? "!" : "i";

  return (
    <div
      role="status"
      className={`toast-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-[0_12px_32px_-12px_rgba(15,50,50,0.35)] ring-1 ${palette}`}
    >
      <span
        aria-hidden
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          toast.kind === "info" ? "bg-white/15 text-gold" : "bg-white/80"
        }`}
      >
        {mark}
      </span>
      <p className="min-w-0 flex-1 pt-0.5">{toast.message}</p>
      <button
        type="button"
        aria-label="បិទ"
        onClick={() => onDismiss(toast.id)}
        className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg text-lg leading-none opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
