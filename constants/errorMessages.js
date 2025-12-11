/**
 * Centralized error messages for the application
 * Supports Spanish and English messages
 */

export const ERROR_MESSAGES = {
    // Network errors
    NETWORK_ERROR: {
        es: 'Error de conexión. Verifica tu conexión a internet.',
        en: 'Connection error. Check your internet connection.',
    },
    TIMEOUT_ERROR: {
        es: 'La solicitud tardó demasiado. Intenta de nuevo.',
        en: 'Request timed out. Please try again.',
    },
    SERVER_ERROR: {
        es: 'Error del servidor. Intenta más tarde.',
        en: 'Server error. Please try again later.',
    },

    // Authentication errors
    AUTH_FAILED: {
        es: 'Usuario o contraseña incorrectos.',
        en: 'Incorrect username or password.',
    },
    AUTH_REQUIRED: {
        es: 'Debe iniciar sesión para continuar.',
        en: 'You must log in to continue.',
    },
    SESSION_EXPIRED: {
        es: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
        en: 'Your session has expired. Please log in again.',
    },

    // Validation errors
    REQUIRED_FIELDS: {
        es: 'Por favor completa todos los campos.',
        en: 'Please fill in all fields.',
    },
    INVALID_USERNAME: {
        es: 'Nombre de usuario inválido.',
        en: 'Invalid username.',
    },
    INVALID_PASSWORD: {
        es: 'Contraseña inválida.',
        en: 'Invalid password.',
    },
    INVALID_STUDENT_ID: {
        es: 'ID de estudiante inválido.',
        en: 'Invalid student ID.',
    },

    // Scanner errors
    CAMERA_PERMISSION_DENIED: {
        es: 'Permiso de cámara denegado.',
        en: 'Camera permission denied.',
    },
    INVALID_QR_CODE: {
        es: 'Código QR inválido.',
        en: 'Invalid QR code.',
    },
    INVALID_BARCODE: {
        es: 'Este escáner es solo para códigos QR. Usa el Escáner de Códigos de Barras para registrar estudiantes como seguros.',
        en: 'This scanner is for QR codes only. Please use the Barcode Scanner to register students as safe.',
    },
    STUDENT_NOT_FOUND: {
        es: 'Estudiante no encontrado.',
        en: 'Student not found.',
    },

    // Emergency errors
    EMERGENCY_ACTIVATION_FAILED: {
        es: 'No se pudo activar la emergencia.',
        en: 'Failed to activate emergency.',
    },
    EMERGENCY_DEACTIVATION_FAILED: {
        es: 'No se pudo desactivar la emergencia.',
        en: 'Failed to deactivate emergency.',
    },

    // Admin errors
    USER_CREATION_FAILED: {
        es: 'No se pudo crear el usuario.',
        en: 'Failed to create user.',
    },
    GROUP_CREATION_FAILED: {
        es: 'No se pudo crear el grupo.',
        en: 'Failed to create group.',
    },

    // Generic errors
    UNKNOWN_ERROR: {
        es: 'Ocurrió un error inesperado.',
        en: 'An unexpected error occurred.',
    },
    OPERATION_FAILED: {
        es: 'La operación falló. Intenta de nuevo.',
        en: 'Operation failed. Please try again.',
    },
};

/**
 * Get error message in specified language
 * @param {string} errorKey - Key from ERROR_MESSAGES
 * @param {string} lang - Language code ('es' or 'en')
 * @returns {string} Localized error message
 */
export const getErrorMessage = (errorKey, lang = 'es') => {
    const message = ERROR_MESSAGES[errorKey];
    if (!message) {
        return ERROR_MESSAGES.UNKNOWN_ERROR[lang];
    }
    return message[lang] || message.es;
};
