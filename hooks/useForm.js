/**
 * useForm Hook
 * Generic form state and validation management
 */

import { useState, useCallback } from 'react';

/**
 * Custom hook for form state management with validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} validateFn - Validation function that returns {valid, errors}
 * @returns {Object} Form utilities
 */
export const useForm = (initialValues = {}, validateFn = null) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    /**
     * Update a single field value
     * @param {string} field - Field name
     * @param {*} value - New value
     */
    const setFieldValue = useCallback((field, value) => {
        setValues(prev => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    /**
     * Update a single field error
     * @param {string} field - Field name
     * @param {string} error - Error message
     */
    const setFieldError = useCallback((field, error) => {
        setErrors(prev => ({
            ...prev,
            [field]: error,
        }));
    }, []);

    /**
     * Mark a field as touched
     * @param {string} field - Field name
     */
    const setFieldTouched = useCallback((field) => {
        setTouched(prev => ({
            ...prev,
            [field]: true,
        }));
    }, []);

    /**
     * Handle field change
     * @param {string} field - Field name
     * @returns {Function} Change handler
     */
    const handleChange = useCallback((field) => (value) => {
        setFieldValue(field, value);
        // Clear error when user starts typing
        if (errors[field]) {
            setFieldError(field, null);
        }
    }, [errors, setFieldValue, setFieldError]);

    /**
     * Handle field blur
     * @param {string} field - Field name
     * @returns {Function} Blur handler
     */
    const handleBlur = useCallback((field) => () => {
        setFieldTouched(field);
    }, [setFieldTouched]);

    /**
     * Validate all fields
     * @returns {boolean} Whether form is valid
     */
    const validate = useCallback(() => {
        if (!validateFn) return true;

        const validation = validateFn(values);
        setErrors(validation.errors || {});
        return validation.valid;
    }, [validateFn, values]);

    /**
     * Reset form to initial values
     */
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    /**
     * Handle form submission
     * @param {Function} onSubmit - Submit handler
     * @returns {Function} Submit event handler
     */
    const handleSubmit = useCallback((onSubmit) => () => {
        const isValid = validate();
        if (isValid && onSubmit) {
            onSubmit(values);
        }
    }, [validate, values]);

    return {
        values,
        errors,
        touched,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        handleChange,
        handleBlur,
        validate,
        resetForm,
        handleSubmit,
    };
};
