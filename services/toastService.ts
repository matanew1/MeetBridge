// services/toastService.ts
import { EventEmitter } from 'events';

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
  private recentToasts = new Map<string, number>(); // message -> timestamp
  private sessionToasts = new Set<string>(); // Track toasts shown in current session
  private readonly DEDUPE_WINDOW = 2000; // 2 seconds

  show(
    type: ToastType,
    title: string,
    message: string,
    duration: number = 4000
  ) {
    // Create a deduplication key
    const dedupeKey = `${type}:${title}:${message}`;
    const now = Date.now();

    // Check if this exact toast was shown recently
    const lastShown = this.recentToasts.get(dedupeKey);
    if (lastShown && now - lastShown < this.DEDUPE_WINDOW) {
      if (__DEV__) {
        console.log('Toast deduped:', dedupeKey);
      }
      return; // Skip duplicate toast
    }

    // Check if this toast was already shown in the current session
    if (this.sessionToasts.has(dedupeKey)) {
      if (__DEV__) {
        console.log('Toast already shown in session:', dedupeKey);
      }
      return; // Skip toast already shown in session
    }

    // Update the recent toasts map
    this.recentToasts.set(dedupeKey, now);

    // Add to session toasts
    this.sessionToasts.add(dedupeKey);

    // Clean up old entries (keep only recent ones)
    for (const [key, timestamp] of this.recentToasts.entries()) {
      if (now - timestamp > this.DEDUPE_WINDOW) {
        this.recentToasts.delete(key);
      }
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

  // Clear session toasts (call this on app start and when navigating to new screens)
  clearSessionToasts() {
    this.sessionToasts.clear();
    if (__DEV__) {
      console.log('🧹 Session toasts cleared');
    }
  }

  // Clear recent toasts (for testing or manual cleanup)
  clearRecentToasts() {
    this.recentToasts.clear();
    if (__DEV__) {
      console.log('🧹 Recent toasts cleared');
    }
  }

  // Get current session toast count (for debugging)
  getSessionToastCount() {
    return this.sessionToasts.size;
  }

  // Get current recent toast count (for debugging)
  getRecentToastCount() {
    return this.recentToasts.size;
  }
}

const toastService = new ToastService();
export default toastService;
