/**
 * useScanner Hook
 * Reusable scanner logic for camera permissions and barcode scanning
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { SCANNER_CONFIG } from '../constants/appConstants';
import api from '../services/api';

/**
 * Custom hook for scanner functionality
 * @param {Object} options - Scanner options
 * @param {Function} options.onScanSuccess - Callback when scan is successful
 * @param {Function} options.onScanError - Callback when scan fails
 * @param {boolean} options.isQROnly - Whether to accept only QR codes (default: true)
 * @returns {Object} Scanner utilities
 */
export const useScanner = ({
    onScanSuccess,
    onScanError,
    isQROnly = true,
} = {}) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(false);

    /**
     * Check if scan is a QR code
     * @param {string} type - Barcode type
     * @returns {boolean} Whether it's a QR code
     */
    const isQRCode = useCallback((type) => {
        return type === 'qr' || type === 256 || type === 'org.iso.QRCode';
    }, []);

    /**
     * Handle barcode scan
     * @param {Object} data - Scan data with type and data properties
     */
    const handleBarCodeScanned = useCallback(async ({ type, data }) => {
        if (scanned || scanning) return;

        const isQR = isQRCode(type);

        // Reject non-QR codes if QR-only mode
        if (isQROnly && !isQR) {
            Alert.alert(
                'Wrong Scanner',
                'This scanner is for QR codes only. Please use the Barcode Scanner to register students as safe.',
                [{ text: 'OK', onPress: () => setScanned(false) }]
            );
            return;
        }

        setScanned(true);
        setScanning(true);

        try {
            // Call success callback
            if (onScanSuccess) {
                await onScanSuccess(data, type);
            }
        } catch (error) {
            console.error('Scan error:', error);

            // Call error callback
            if (onScanError) {
                onScanError(error);
            } else {
                // Default error handling
                Alert.alert(
                    'Error',
                    error.message || 'An error occurred during scanning',
                    [{ text: 'OK' }]
                );
            }
        } finally {
            setScanning(false);
            // Reset scanned state after delay to prevent duplicate scans
            setTimeout(() => setScanned(false), SCANNER_CONFIG.SCAN_DELAY);
        }
    }, [scanned, scanning, isQROnly, isQRCode, onScanSuccess, onScanError]);

    /**
     * Reset scanner state
     */
    const resetScanner = useCallback(() => {
        setScanned(false);
        setScanning(false);
    }, []);

    /**
     * Request camera permission
     */
    const requestCameraPermission = useCallback(async () => {
        const result = await requestPermission();
        return result.granted;
    }, [requestPermission]);

    return {
        permission,
        scanned,
        scanning,
        handleBarCodeScanned,
        resetScanner,
        requestCameraPermission,
    };
};
