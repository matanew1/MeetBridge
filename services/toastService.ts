// services/toastService.ts
import { EventEmitter } from 'events';
import { AppState } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

class ToastService extends EventEmitter {
  private toastCounter = 0;
  private recentToasts: Map<string, number> = new Map(); // toast key -> timestamp
  private readonly DEDUPE_WINDOW = 5000; // 5 seconds

  private isAppActive(): boolean {
    return AppState.currentState === 'active';
  }

  private getToastKey(type: ToastType, title: string, message: string): string {
    return `${type}:${title}:${message}`;
  }

  private shouldShowToast(
    type: ToastType,
    title: string,
    message: string
  ): boolean {
    const key = this.getToastKey(type, title, message);
    const now = Date.now();
    const lastShown = this.recentToasts.get(key);

    if (lastShown && now - lastShown < this.DEDUPE_WINDOW) {
      if (__DEV__) {
        console.log('Toast deduplicated - shown recently:', title);
      }
      return false;
    }

    // Update timestamp
    this.recentToasts.set(key, now);

    // Clean up old entries (keep only recent ones)
    for (const [k, timestamp] of this.recentToasts.entries()) {
      if (now - timestamp > this.DEDUPE_WINDOW) {
        this.recentToasts.delete(k);
      }
    }

    return true;
  }

  show(
    type: ToastType,
    title: string,
    message: string,
    duration: number = 4000
  ) {
    // Only show toasts when app is active
    if (!this.isAppActive()) {
      if (__DEV__) {
        console.log('Toast skipped - app not active:', title);
      }
      return;
    }

    // Check for duplicates
    if (!this.shouldShowToast(type, title, message)) {
      return;
    }

    const id = `toast-${Date.now()}-${this.toastCounter++}`;
    const toast: ToastMessage = {
      id,
      type,
      title,
      message,
      duration,
    };

    this.emit('show', toast);
  }

  success(title: string, message: string = '', duration?: number) {
    this.show('success', title, message, duration);
  }

  error(title: string, message: string = '', duration?: number) {
    this.show('error', title, message, duration);
  }

  warning(title: string, message: string = '', duration?: number) {
    this.show('warning', title, message, duration);
  }

  info(title: string, message: string = '', duration?: number) {
    this.show('info', title, message, duration);
  }

  hide(id: string) {
    this.emit('hide', id);
  }

  // Debug methods for toast management
  clearRecentToasts() {
    this.recentToasts.clear();
  }

  getSessionToastCount(): number {
    return this.toastCounter;
  }

  getRecentToastCount(): number {
    return this.recentToasts.size;
  }
}

const toastService = new ToastService();
export default toastService;
