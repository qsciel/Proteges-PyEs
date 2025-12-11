/**
 * useApi Hook
 * Generic hook for API calls with loading and error states
 */

import { useState, useCallback } from 'react';
import { handleError } from '../utils/errorHandler';

/**
 * Custom hook for API calls with automatic loading and error state management
 * @returns {Object} API call utilities
 */
export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Execute an API call with automatic state management
     * @param {Function} apiFunction - Async function that makes the API call
     * @param {Function} onSuccess - Optional callback on success
     * @param {Function} onError - Optional callback on error
     * @returns {Promise<*>} API response data or undefined
     */
    const execute = useCallback(async (apiFunction, onSuccess = null, onError = null) => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiFunction();
            if (onSuccess) {
                onSuccess(data);
            }
            return data;
        } catch (err) {
            const errorMessage = handleError(err, 'API Call');
            setError(errorMessage);
            if (onError) {
                onError(err, errorMessage);
            }
            return undefined;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Reset error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        loading,
        error,
        execute,
        clearError,
    };
};
