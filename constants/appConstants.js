/**
 * Application-wide constants
 */

// API Configuration
export const API_CONFIG = {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
};

// Session Configuration
export const SESSION_CONFIG = {
    STORAGE_KEY: '@proteges_pyes_user',
    AUTO_LOGOUT_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Scanner Configuration
export const SCANNER_CONFIG = {
    SCAN_DELAY: 500, // Delay before allowing next scan (ms)
    BARCODE_TYPES: ['qr'], // Only QR codes for main scanner
    BARCODE_SCANNER_TYPES: ['code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e'], // For emergency scanner
};

// UI Configuration
export const UI_CONFIG = {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000,
};

// List Configuration
export const LIST_CONFIG = {
    INITIAL_NUM_TO_RENDER: 10,
    MAX_TO_RENDER_PER_BATCH: 10,
    UPDATE_CELLS_BATCH_PERIOD: 50,
    WINDOW_SIZE: 21,
};

// Limits
export const LIMITS = {
    MAX_USERNAME_LENGTH: 50,
    MIN_PASSWORD_LENGTH: 4,
    MAX_PASSWORD_LENGTH: 128,
    MAX_GROUP_NAME_LENGTH: 100,
};

// App Information
export const APP_INFO = {
    NAME: 'Proteges PyEs -S',
    VERSION: '1.0.0',
    COPYRIGHT: '© 2025 Proteges PyEs -S System',
};
