/**
 * Authentication Context
 * Provides authentication state and functions throughout the app
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { SESSION_CONFIG } from '../constants/appConstants';
import { storeData, getData, removeData } from '../utils/storage';

/**
 * Auth Context
 */
export const AuthContext = createContext({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
    setUser: () => { },
});

/**
 * Auth Context Provider
 * Manages authentication state with session persistence
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Restore user session from storage
     */
    const restoreSession = useCallback(async () => {
        try {
            const savedUser = await getData(SESSION_CONFIG.STORAGE_KEY);
            if (savedUser) {
                setUser(savedUser);
            }
        } catch (error) {
            console.error('Error restoring session:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Login user and save to storage
     * @param {Object} userData - User data
     */
    const login = useCallback(async (userData) => {
        setUser(userData);
        await storeData(SESSION_CONFIG.STORAGE_KEY, userData);
    }, []);

    /**
     * Logout user and clear storage
     */
    const logout = useCallback(async () => {
        setUser(null);
        await removeData(SESSION_CONFIG.STORAGE_KEY);
    }, []);

    // Restore session on mount
    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    const value = {
        user,
        loading,
        login,
        logout,
        setUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
