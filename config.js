/**
 * Application Configuration
 * Central configuration for the entire application
 */

// ========== API Configuration ==========

/**
 * API Base URL
 * Replace with your computer's local IP address for local development
 * Find it by running 'ipconfig' in terminal (look for IPv4 Address)
 *
 * Examples:
 * - Local: 'http://192.168.1.10:5000'
 * - Production: 'https://your-production-url.com'
 * - Ngrok: 'https://your-subdomain.ngrok-free.dev'
 */
//export const API_URL = 'https://lichenoid-smirchless-audrianna.ngrok-free.dev';
export const API_URL = "http://192.168.1.64:5000";
//export const API_URL = 'http://127.0.0.1:5000';
// ========== Environment Configuration ==========

/**
 * Environment mode
 * @type {'development'|'production'}
 */
export const ENV = __DEV__ ? "development" : "production";

/**
 * Enable debug logging
 */
export const DEBUG_ENABLED = __DEV__;

// ========== Feature Flags ==========

/**
 * Feature flags for conditional features
 */
export const FEATURES = {
  // Enable session persistence
  SESSION_PERSISTENCE: true,

  // Enable offline mode (future feature)
  OFFLINE_MODE: false,

  // Enable analytics (future feature)
  ANALYTICS: false,

  // Enable biometric authentication (future feature)
  BIOMETRIC_AUTH: false,
};

// ========== Timeouts and Delays ==========

/**
 * API request timeout (milliseconds)
 */
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * Scanner delay between scans (milliseconds)
 */
export const SCANNER_DELAY = 500;

/**
 * Debounce delay for inputs (milliseconds)
 */
export const DEBOUNCE_DELAY = 300;

// ========== App Metadata ==========

/**
 * Application name
 */
export const APP_NAME = "Proteges PyEs -S";

/**
 * Application version
 */
export const APP_VERSION = "1.0.0";

/**
 * Default language
 * @type {'es'|'en'}
 */
export const DEFAULT_LANGUAGE = "es";

// ========== Configuration Object ==========

/**
 * Complete configuration object
 * Useful for exporting all configs at once
 */
export const CONFIG = {
  api: {
    url: API_URL,
    timeout: API_TIMEOUT,
  },
  app: {
    name: APP_NAME,
    version: APP_VERSION,
    language: DEFAULT_LANGUAGE,
  },
  environment: {
    mode: ENV,
    debug: DEBUG_ENABLED,
  },
  features: FEATURES,
  timing: {
    scannerDelay: SCANNER_DELAY,
    debounceDelay: DEBOUNCE_DELAY,
  },
};
