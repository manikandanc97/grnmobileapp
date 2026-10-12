import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { toast, ToastOptions } from '@/lib/toast';
import { ToastBanner } from '@/components/ui/ToastBanner';

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ToastContextValue>(
    () => ({
      show: (options) => toast.show(options),
      success: (title, message, duration) => toast.success(title, message, duration),
      error: (title, message, duration) => toast.error(title, message, duration),
      info: (title, message, duration) => toast.info(title, message, duration),
      warning: (title, message, duration) => toast.warning(title, message, duration),
      dismiss: () => toast.dismiss(),
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastBanner />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback to direct singleton if used outside provider
    return {
      show: (options) => toast.show(options),
      success: (title, message, duration) => toast.success(title, message, duration),
      error: (title, message, duration) => toast.error(title, message, duration),
      info: (title, message, duration) => toast.info(title, message, duration),
      warning: (title, message, duration) => toast.warning(title, message, duration),
      dismiss: () => toast.dismiss(),
    };
  }
  return context;
}
