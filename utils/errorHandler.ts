// utils/errorHandler.ts
import toastService from '../services/toastService';

export interface ErrorHandlerOptions {
  title?: string;
  showToast?: boolean;
  logError?: boolean;
  duration?: number;
}

class ErrorHandler {
  /**
   * Handle errors globally with toast notifications
   */
  handle(
    error: any,
    options: ErrorHandlerOptions = {}
  ): { success: false; message: string } {
    const {
      title = 'Error',
      showToast = true,
      logError = true,
      duration,
    } = options;

    // Log error to console
    if (logError) {
      console.error(`[ErrorHandler] ${title}:`, error);
    }

    // Extract error message
    let errorMessage = 'An unexpected error occurred';

    if (error) {
      // Firebase errors
      if (error.code) {
        errorMessage = this.getFirebaseErrorMessage(error.code);
      }
      // Standard Error objects
      else if (error.message) {
        errorMessage = error.message;
      }
      // String errors
      else if (typeof error === 'string') {
        errorMessage = error;
      }
    }

    // Show toast notification
    if (showToast) {
      toastService.error(title, errorMessage, duration);
    }

    return {
      success: false,
      message: errorMessage,
    };
  }

  /**
   * Handle Firebase-specific errors with user-friendly messages
   */
  private getFirebaseErrorMessage(code: string): string {
    const errorMessages: { [key: string]: string } = {
      // Auth errors
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/weak-password': 'Password is too weak',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-credential':
        'Invalid credentials. Please check your email and password',
      'auth/invalid-login-credentials': 'Invalid email or password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed':
        'Network error. Please check your connection',
      'auth/requires-recent-login':
        'Please log out and log back in to continue',
      'auth/credential-already-in-use': 'This credential is already in use',
      'auth/invalid-verification-code': 'Invalid verification code',
      'auth/invalid-verification-id': 'Invalid verification ID',

      // Firestore errors
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'Requested resource not found',
      'already-exists': 'Resource already exists',
      'failed-precondition': 'Operation cannot be performed in current state',
      unavailable: 'Service temporarily unavailable',
      unauthenticated: 'Please log in to continue',
      'resource-exhausted': 'Quota exceeded. Please try again later',
      cancelled: 'Operation was cancelled',
      'data-loss': 'Data loss detected',
      'deadline-exceeded': 'Operation timed out',
      'invalid-argument': 'Invalid data provided',
      'out-of-range': 'Value out of acceptable range',
      unimplemented: 'Feature not yet implemented',
      internal: 'Internal server error',
      unknown: 'Unknown error occurred',

      // Storage errors
      'storage/unauthorized': 'Unauthorized to access storage',
      'storage/canceled': 'Upload cancelled',
      'storage/unknown': 'Unknown storage error',
      'storage/object-not-found': 'File not found',
      'storage/bucket-not-found': 'Storage bucket not found',
      'storage/project-not-found': 'Project not found',
      'storage/quota-exceeded': 'Storage quota exceeded',
      'storage/unauthenticated': 'Please log in to upload files',
      'storage/retry-limit-exceeded': 'Maximum retry time exceeded',
      'storage/invalid-checksum': 'File checksum mismatch',
      'storage/invalid-event-name': 'Invalid event name',
      'storage/invalid-url': 'Invalid URL',
      'storage/invalid-argument': 'Invalid argument',
      'storage/no-default-bucket': 'No default bucket configured',
      'storage/cannot-slice-blob': 'Cannot slice file',
      'storage/server-file-wrong-size': 'Server file size mismatch',
    };

    return errorMessages[code] || `Error: ${code}`;
  }

  /**
   * Show success message
   */
  success(title: string, message: string = '', duration?: number) {
    toastService.success(title, message, duration);
  }

  /**
   * Show warning message
   */
  warning(title: string, message: string = '', duration?: number) {
    toastService.warning(title, message, duration);
  }

  /**
   * Show info message
   */
  info(title: string, message: string = '', duration?: number) {
    toastService.info(title, message, duration);
  }

  /**
   * Show error message without handling exception
   */
  error(title: string, message: string = '', duration?: number) {
    toastService.error(title, message, duration);
  }
}

const errorHandler = new ErrorHandler();
export default errorHandler;
