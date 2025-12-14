/**
 * API Configuration
 * Centralized configuration for API requests
 */

import { API_URL } from '../config';
import { API_CONFIG } from '../constants/appConstants';

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
    // Authentication
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',

    // Students
    STUDENT: (id) => `/student/${id}`,
    STUDENTS: '/students', // Check if this exists
    CREATE_STUDENT: '/student', // Matches .nest("/student") + post("/") probably
    UPDATE_STUDENT_GROUP: (id) => `/student/${id}/group`,
    UPDATE_STUDENT: (id) => `/student/${id}/update`,
    TOGGLE_SCAN: '/scan/toggle',

    // Scans & History
    EMERGENCY_HISTORY: '/emergency/history', // Check if this exists

    // Attendance
    ATTENDANCE_REGISTER: '/attendance',
    ATTENDANCE_HISTORY: '/attendance/history',

    // Emergency
    SCAN: '/scan',
    SCANS: '/scans',

    // Emergency
    EMERGENCY: '/emergency',
    EMERGENCY_TRIGGER: '/emergency/trigger',
    EMERGENCY_STATUS: '/emergency/status',

    // Stats
    STATS: '/stats',

    // Admin
    USERS: '/user/all', // Changed from /users to /user/all to match backend routes
    GROUPS: '/groups',
};

/**
 * Default headers for API requests
 */
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

/**
 * Request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = API_CONFIG.TIMEOUT;

/**
 * Get full API URL for endpoint
 * @param {string} endpoint - API endpoint
 * @returns {string} Full URL
 */
export const getApiUrl = (endpoint) => {
    return `${API_URL}${endpoint}`;
};

/**
 * Create fetch config with timeout
 * @param {Object} config - Fetch configuration
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Fetch promise with timeout
 */
export const fetchWithTimeout = async (url, config, timeout = REQUEST_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...config,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
};
