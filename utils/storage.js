/**
 * AsyncStorage wrapper utility
 * Provides type-safe storage operations with error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Store data in AsyncStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {Promise<boolean>} Success status
 */
export const storeData = async (key, value) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
        return true;
    } catch (error) {
        console.error(`Error storing data for key "${key}":`, error);
        return false;
    }
};

/**
 * Retrieve data from AsyncStorage
 * @param {string} key - Storage key
 * @returns {Promise<*>} Retrieved value or null
 */
export const getData = async (key) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
        console.error(`Error retrieving data for key "${key}":`, error);
        return null;
    }
};

/**
 * Remove data from AsyncStorage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} Success status
 */
export const removeData = async (key) => {
    try {
        await AsyncStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing data for key "${key}":`, error);
        return false;
    }
};

/**
 * Clear all data from AsyncStorage
 * @returns {Promise<boolean>} Success status
 */
export const clearAllData = async () => {
    try {
        await AsyncStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing AsyncStorage:', error);
        return false;
    }
};

/**
 * Get all keys from AsyncStorage
 * @returns {Promise<string[]>} Array of keys or empty array
 */
export const getAllKeys = async () => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        return keys;
    } catch (error) {
        console.error('Error getting all keys:', error);
        return [];
    }
};

/**
 * Check if key exists in AsyncStorage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} Whether key exists
 */
export const keyExists = async (key) => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        return keys.includes(key);
    } catch (error) {
        console.error(`Error checking if key "${key}" exists:`, error);
        return false;
    }
};
