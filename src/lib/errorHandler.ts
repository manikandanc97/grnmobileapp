export type ErrorCategory =
  | 'network'
  | 'backend_unavailable'
  | 'auth_expired'
  | 'permission_denied'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'unknown';

export interface UserFriendlyError {
  category: ErrorCategory;
  title: string;
  message: string;
  retryable: boolean;
  technicalDetails?: string;
  isNetworkError: boolean;
}

function buildError(base: Omit<UserFriendlyError, 'isNetworkError'>): UserFriendlyError {
  return {
    ...base,
    isNetworkError: base.category === 'network',
  };
}

/**
 * Normalizes any error object or exception into an enterprise user-friendly error
 */
export function parseAppError(error: unknown, fallbackMessage?: string): UserFriendlyError {
  if (__DEV__) {
    console.warn('[ErrorHandler] Raw Error caught:', error);
  }

  if (!error) {
    return buildError({
      category: 'unknown',
      title: 'Something went wrong',
      message: fallbackMessage || 'An unexpected error occurred. Please try again.',
      retryable: true,
    });
  }

  let rawMsg = '';
  let code = '';

  if (typeof error === 'string') {
    rawMsg = error;
  } else if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as any).message === 'string') {
      rawMsg = (error as any).message;
    }
    if ('code' in error && typeof (error as any).code === 'string') {
      code = (error as any).code;
    }
    if ('status' in error && typeof (error as any).status === 'number') {
      code = String((error as any).status);
    }
  }

  const msg = rawMsg.toLowerCase();

  // 1. Network / Offline Errors
  if (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('offline') ||
    msg.includes('connection refused') ||
    msg.includes('timeout') ||
    code === 'ECONNABORTED'
  ) {
    return buildError({
      category: 'network',
      title: 'Connection Issue',
      message: 'Unable to connect to the server. Check your internet connection and try again.',
      retryable: true,
      technicalDetails: rawMsg,
    });
  }

  // 2. Authentication Expired
  if (
    msg.includes('jwt') ||
    msg.includes('token is expired') ||
    msg.includes('not authenticated') ||
    msg.includes('invalid refresh token') ||
    code === '401' ||
    code === 'PGRST301'
  ) {
    return buildError({
      category: 'auth_expired',
      title: 'Session Expired',
      message: 'Your session has expired. Please sign in again.',
      retryable: false,
      technicalDetails: rawMsg,
    });
  }

  // 3. Permission / RLS Denied
  if (
    msg.includes('row-level security') ||
    msg.includes('permission denied') ||
    msg.includes('access denied') ||
    code === '42501' ||
    code === '403'
  ) {
    return buildError({
      category: 'permission_denied',
      title: 'Access Restricted',
      message: "You don't have permission to perform this action. Verify your account privileges.",
      retryable: false,
      technicalDetails: rawMsg,
    });
  }

  // 4. Record Not Found
  if (code === 'PGRST116' || msg.includes('not found') || code === '404') {
    return buildError({
      category: 'not_found',
      title: 'Record Not Found',
      message: 'This record is no longer available or was removed.',
      retryable: true,
      technicalDetails: rawMsg,
    });
  }

  // 5. Unique Conflict / Duplicate
  if (
    code === '23505' ||
    msg.includes('unique constraint') ||
    msg.includes('already exists') ||
    msg.includes('conflict')
  ) {
    return buildError({
      category: 'conflict',
      title: 'Already Exists',
      message: 'A record with this information already exists. Please verify your entries.',
      retryable: false,
      technicalDetails: rawMsg,
    });
  }

  // 6. Validation Error
  if (
    msg.includes('violates foreign key') ||
    msg.includes('violates check constraint') ||
    msg.includes('invalid input') ||
    msg.includes('validation') ||
    code === '23514' ||
    code === '23503' ||
    code === '22P02'
  ) {
    return buildError({
      category: 'validation',
      title: 'Invalid Data',
      message: 'Please review and verify the highlighted fields.',
      retryable: false,
      technicalDetails: rawMsg,
    });
  }

  // 7. Backend 5xx
  if (
    code.startsWith('5') ||
    msg.includes('internal server error') ||
    msg.includes('bad gateway') ||
    msg.includes('service unavailable')
  ) {
    return buildError({
      category: 'backend_unavailable',
      title: 'Server Unavailable',
      message: 'The server is temporarily unavailable. Please try again in a few moments.',
      retryable: true,
      technicalDetails: rawMsg,
    });
  }

  // Fallback
  return buildError({
    category: 'unknown',
    title: 'Operation Failed',
    message: fallbackMessage || 'Something went wrong. Please try again.',
    retryable: true,
    technicalDetails: rawMsg,
  });
}
