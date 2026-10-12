/**
 * GRN Construction - Global Toast Notification System
 * Lightweight, accessible, singleton-friendly toast manager.
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 3200
  action?: {
    label: string;
    onPress: () => void;
  };
}

export type ToastListener = (toast: ToastOptions | null) => void;

class ToastManager {
  private listeners: Set<ToastListener> = new Set();
  private activeToast: ToastOptions | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    if (this.activeToast) {
      listener(this.activeToast);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(toast: ToastOptions | null) {
    this.activeToast = toast;
    this.listeners.forEach((listener) => listener(toast));
  }

  public show(options: ToastOptions) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const toastData: ToastOptions = {
      id: options.id || String(Date.now()),
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration: options.duration ?? 3200,
      action: options.action,
    };

    this.notify(toastData);

    const dur = toastData.duration || 3200;
    if (dur > 0) {
      this.timer = setTimeout(() => {
        this.dismiss();
      }, dur);
    }
  }

  public success(title: string, message?: string, duration?: number) {
    this.show({ title, message, type: 'success', duration });
  }

  public error(title: string, message?: string, duration?: number) {
    this.show({ title, message, type: 'error', duration });
  }

  public info(title: string, message?: string, duration?: number) {
    this.show({ title, message, type: 'info', duration });
  }

  public warning(title: string, message?: string, duration?: number) {
    this.show({ title, message, type: 'warning', duration });
  }

  public dismiss() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.notify(null);
  }

  public getActive(): ToastOptions | null {
    return this.activeToast;
  }
}

export const toast = new ToastManager();
