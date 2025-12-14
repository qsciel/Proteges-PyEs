/**
 * API Service
 * Centralized API communication layer with error handling and logging
 */

import { API_ENDPOINTS, DEFAULT_HEADERS, getApiUrl, fetchWithTimeout } from './apiConfig';
import { parseResponse, handleNetworkError, logRequest, logResponse } from './errorService';

/**
 * API Service Class
 * Handles all API requests with consistent error handling
 */
class ApiService {
    /**
     * Make an API request
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {Object|null} body - Request body
     * @returns {Promise<Object>} Response data
     * @throws {ApiError|NetworkError} On request failure
     */
    async request(endpoint, method = 'GET', body = null) {
        const config = {
            method,
            headers: DEFAULT_HEADERS,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        logRequest(method, endpoint, body);

        try {
            const url = getApiUrl(endpoint);
            const response = await fetchWithTimeout(url, config);
            const data = await parseResponse(response);

            logResponse(endpoint, data);
            return data;
        } catch (error) {
            handleNetworkError(error, endpoint);
        }
    }

    /**
     * Make a GET request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} Response data
     */
    get(endpoint) {
        return this.request(endpoint, 'GET');
    }

    /**
     * Make a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} body - Request body
     * @returns {Promise<Object>} Response data
     */
    post(endpoint, body) {
        return this.request(endpoint, 'POST', body);
    }

    /**
     * Make a PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} body - Request body
     * @returns {Promise<Object>} Response data
     */
    put(endpoint, body) {
        return this.request(endpoint, 'PUT', body);
    }

    /**
     * Make a DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} Response data
     */
    delete(endpoint) {
        return this.request(endpoint, 'DELETE');
    }

    // ========== Authentication APIs ==========

    /**
     * Login with username and password
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} User data
     */
    async login(username, password) {
        return this.post(API_ENDPOINTS.LOGIN, { username, password });
    }

    // ========== Student APIs ==========

    /**
     * Get student by ID
     * @param {string} id - Student ID
     * @returns {Promise<Object>} Student data
     */
    async getStudent(id) {
        return this.get(API_ENDPOINTS.STUDENT(id));
    }

    // ========== Scan APIs ==========

    /**
     * Register a scan
     * @param {string} studentId - Student ID
     * @param {string} userId - User ID
     * @param {string} type - Scan type (entry, exit, emergency)
     * @returns {Promise<Object>} Scan result
     */
    async registerScan(studentId, userId, type) {
        return this.post(API_ENDPOINTS.SCAN, {
            student_id: studentId,
            user_id: userId,
            scan_type: type
        });
    }

    // ========== Emergency APIs ==========

    /**
     * Get list of students for emergency
     * @returns {Promise<Object>} Emergency students data
     */
    async getEmergencyStudents() {
        return this.get(API_ENDPOINTS.EMERGENCY);
    }

    /**
     * Get scan history for emergency
     * @returns {Promise<Object>} History data
     */
    async getEmergencyHistory() {
        return this.get(API_ENDPOINTS.EMERGENCY_HISTORY);
    }

    /**
     * Trigger or deactivate emergency
     * @param {boolean} active - Emergency status
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Emergency result
     */
    async triggerEmergency(active, userId) {
        return this.post(API_ENDPOINTS.EMERGENCY_TRIGGER, { active, user_id: userId });
    }

    /**
     * Get emergency status
     * @returns {Promise<Object>} Emergency status
     */
    async getEmergencyStatus() {
        return this.get(API_ENDPOINTS.EMERGENCY_STATUS);
    }

    // ========== Stats APIs ==========

    /**
     * Get application statistics
     * @returns {Promise<Object>} Statistics data
     */
    async getStats() {
        return this.get(API_ENDPOINTS.STATS);
    }

    /**
     * Create a new student manually
     * @param {Object} studentData 
     */
    async createStudent(studentData) {
        return this.post(API_ENDPOINTS.CREATE_STUDENT, studentData);
    }

    /**
     * Update full student details
     * @param {string} id
     * @param {Object} studentData
     */
    async updateStudent(id, studentData) {
        return this.post(API_ENDPOINTS.UPDATE_STUDENT(id), studentData);
    }

    /**
     * Update student group
     * @param {string} id 
     * @param {string} group 
     */
    async updateStudentGroup(id, group) {
        return this.post(API_ENDPOINTS.UPDATE_STUDENT_GROUP(id), { group });
    }

    /**
     * Toggle scan status (Safe/Missing)
     * @param {string} studentId 
     * @param {number} userId 
     */
    async toggleScanStatus(studentId, userId) {
        return this.post(API_ENDPOINTS.TOGGLE_SCAN, { student_id: studentId, user_id: userId });
    }
    /**
     * Get emergency scan history
     */
    async getScanHistory() {
        return this.get(API_ENDPOINTS.EMERGENCY_HISTORY);
    }

    /**
     * Register attendance
     * @param {string} studentId 
     * @param {boolean} present 
     */
    async registerAttendance(studentId, present = true) {
        const payload = {
            student_id: studentId,
            user_id: 1,
            classroom: 'N/A',
            present
        };
        return this.post(API_ENDPOINTS.ATTENDANCE_REGISTER, payload);
    }

    /**
     * Get attendance history
     */
    async getAttendanceHistory() {
        return this.get(API_ENDPOINTS.ATTENDANCE_HISTORY);
    }
}


// Export singleton instance


export default new ApiService();
