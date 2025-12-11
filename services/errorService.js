/**
 * Error Service
 * Centralized error handling and logging for API calls
 */

import { ApiError, NetworkError, handleError } from '../utils/errorHandler';

/**
 * Parse fetch response and handle errors
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Parsed JSON data
 * @throws {ApiError} If response is not ok
 */
export const parseResponse = async (response) => {
    // Check for JSON content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new ApiError(
            'Invalid server response (not JSON)',
            response.status,
            'INVALID_RESPONSE'
        );
    }

    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(
            data.error || data.message || 'API Request Failed',
            response.status,
            'API_ERROR'
        );
    }

    return data;
};

/**
 * Handle network errors
 * @param {Error} error - Error object
 * @param {string} endpoint - API endpoint
 * @throws {NetworkError|ApiError} Appropriate error type
 */
export const handleNetworkError = (error, endpoint) => {
    console.error(`API Error (${endpoint}):`, error);

    // API errors (already processed) - Check this FIRST
    if (error instanceof ApiError) {
        throw error;
    }

    // Timeout errors
    if (error.message === 'Request timeout' || error.name === 'AbortError') {
        throw new ApiError(
            'Request timed out. Please try again.',
            408,
            'TIMEOUT_ERROR'
        );
    }

    // Network errors
    if (!navigator.onLine || error.message.includes('Network')) {
        throw new NetworkError(
            'No internet connection. Please check your network.',
        );
    }

    // Unknown errors
    throw new ApiError(
        error.message || 'An unexpected error occurred',
        500,
        'UNKNOWN_ERROR'
    );
};

/**
 * Log API request
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 */
export const logRequest = (method, endpoint, body = null) => {
    if (__DEV__) {
        console.log(`[API Request] ${method} ${endpoint}`, body ? { body } : '');
    }
};

/**
 * Log API response
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Response data
 */
export const logResponse = (endpoint, data) => {
    if (__DEV__) {
        console.log(`[API Response] ${endpoint}`, data);
    }
};
