/**
 * Error handling utility functions
 */

import { ERROR_MESSAGES, getErrorMessage } from '../constants/errorMessages';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    constructor(message, statusCode, errorType = 'API_ERROR') {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.errorType = errorType;
    }
}

/**
 * Custom error class for network errors
 */
export class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
        this.errorType = 'NETWORK_ERROR';
    }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.errorType = 'VALIDATION_ERROR';
        this.field = field;
    }
}

/**
 * Parse error and return user-friendly message
 * @param {Error} error - Error object
 * @param {string} lang - Language code
 * @returns {string} User-friendly error message
 */
export const parseError = (error, lang = 'es') => {
    if (!error) {
        return getErrorMessage('UNKNOWN_ERROR', lang);
    }

    // If error has a message property that matches our error keys
    if (ERROR_MESSAGES[error.message]) {
        return getErrorMessage(error.message, lang);
    }

    // Network errors
    if (error.name === 'NetworkError' || error.message?.includes('Network')) {
        return getErrorMessage('NETWORK_ERROR', lang);
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
        return getErrorMessage('TIMEOUT_ERROR', lang);
    }

    // API errors with custom messages
    if (error instanceof ApiError && error.message) {
        return error.message;
    }

    // Validation errors
    if (error instanceof ValidationError && error.message) {
        return error.message;
    }

    // Generic error with message
    if (error.message) {
        return error.message;
    }

    // Fallback
    return getErrorMessage('UNKNOWN_ERROR', lang);
};

/**
 * Log error to console with details
 * @param {Error} error - Error to log
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = '') => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Error in ${context}:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error.statusCode && { statusCode: error.statusCode }),
        ...(error.errorType && { errorType: error.errorType }),
    });
};

/**
 * Handle error with logging and return user-friendly message
 * @param {Error} error - Error to handle
 * @param {string} context - Context where error occurred
 * @param {string} lang - Language code
 * @returns {string} User-friendly error message
 */
export const handleError = (error, context = '', lang = 'es') => {
    logError(error, context);
    return parseError(error, lang);
};
