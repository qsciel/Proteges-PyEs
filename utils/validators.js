/**
 * Validation utility functions
 */

import { LIMITS } from '../constants/appConstants';

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateUsername = (username) => {
    if (!username || username.trim().length === 0) {
        return { valid: false, error: 'Username is required' };
    }

    if (username.length > LIMITS.MAX_USERNAME_LENGTH) {
        return { valid: false, error: `Username must be ${LIMITS.MAX_USERNAME_LENGTH} characters or less` };
    }

    return { valid: true, error: null };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export const validatePassword = (password) => {
    if (!password || password.length === 0) {
        return { valid: false, error: 'Password is required' };
    }

    if (password.length < LIMITS.MIN_PASSWORD_LENGTH) {
        return { valid: false, error: `Password must be at least ${LIMITS.MIN_PASSWORD_LENGTH} characters` };
    }

    if (password.length > LIMITS.MAX_PASSWORD_LENGTH) {
        return { valid: false, error: `Password must be ${LIMITS.MAX_PASSWORD_LENGTH} characters or less` };
    }

    return { valid: true, error: null };
};

/**
 * Validate student ID
 * @param {string} studentId - Student ID to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateStudentId = (studentId) => {
    if (!studentId || studentId.trim().length === 0) {
        return { valid: false, error: 'Student ID is required' };
    }

    // Student IDs should be alphanumeric
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(studentId)) {
        return { valid: false, error: 'Student ID must be alphanumeric' };
    }

    return { valid: true, error: null };
};

/**
 * Validate group name
 * @param {string} groupName - Group name to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateGroupName = (groupName) => {
    if (!groupName || groupName.trim().length === 0) {
        return { valid: false, error: 'Group name is required' };
    }

    if (groupName.length > LIMITS.MAX_GROUP_NAME_LENGTH) {
        return { valid: false, error: `Group name must be ${LIMITS.MAX_GROUP_NAME_LENGTH} characters or less` };
    }

    return { valid: true, error: null };
};

/**
 * Validate login form
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Object} { valid: boolean, errors: Object }
 */
export const validateLoginForm = (username, password) => {
    const usernameValidation = validateUsername(username);
    const passwordValidation = validatePassword(password);

    const errors = {};
    if (!usernameValidation.valid) {
        errors.username = usernameValidation.error;
    }
    if (!passwordValidation.valid) {
        errors.password = passwordValidation.error;
    }

    return {
        valid: usernameValidation.valid && passwordValidation.valid,
        errors,
    };
};
