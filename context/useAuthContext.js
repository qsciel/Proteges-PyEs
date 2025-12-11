/**
 * useAuthContext Hook
 * Custom hook to use AuthContext with validation
 */

import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * Use Auth Context
 * Safely access auth context with validation
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export const useAuthContext = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }

    return context;
};
