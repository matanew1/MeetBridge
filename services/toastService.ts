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

  show(
    type: ToastType,
    title: string,
    message: string,
    duration: number = 4000
  ) {
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
}

const toastService = new ToastService();
export default toastService;
