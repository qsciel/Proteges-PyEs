/**
 * useEmergency Hook
 * Emergency management logic
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import api from '../services/api';
import { handleError } from '../utils/errorHandler';

/**
 * Custom hook for emergency management
 * @param {Object} user - Current user object
 * @returns {Object} Emergency utilities
 */
export const useEmergency = (user) => {
    const [emergencyActive, setEmergencyActive] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    /**
     * Fetch emergency data
     */
    const fetchData = useCallback(async (isRefreshing = false) => {
        if (isRefreshing) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [statusData, studentsData] = await Promise.all([
                api.getEmergencyStatus(),
                api.getEmergencyStudents(),
            ]);

            setEmergencyActive(statusData.active || false);
            setStudents(studentsData.students || []);
        } catch (error) {
            const errorMessage = handleError(error, 'Emergency Fetch');
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    /**
     * Toggle emergency status
     */
    const toggleEmergency = useCallback(async () => {
        if (!user?.id) return;

        try {
            const newStatus = !emergencyActive;
            await api.triggerEmergency(newStatus, user.id);
            setEmergencyActive(newStatus);

            Alert.alert(
                'Success',
                newStatus ? 'Emergency activated!' : 'Emergency deactivated.'
            );

            // Refresh data after toggle
            fetchData();
        } catch (error) {
            const errorMessage = handleError(error, 'Emergency Toggle');
            Alert.alert('Error', errorMessage);
        }
    }, [emergencyActive, user, fetchData]);

    /**
     * Group students by status
     * @returns {Array} Sections for SectionList
     */
    const getGroupedStudents = useCallback(() => {
        const safe = students.filter(s => s.is_safe);
        const unsafe = students.filter(s => !s.is_safe);

        const sections = [];
        if (unsafe.length > 0) {
            sections.push({
                title: `Not Safe (${unsafe.length})`,
                data: unsafe,
            });
        }
        if (safe.length > 0) {
            sections.push({
                title: `Safe (${safe.length})`,
                data: safe,
            });
        }
        return sections;
    }, [students]);

    /**
     * Refresh emergency data
     */
    const refresh = useCallback(() => {
        fetchData(true);
    }, [fetchData]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        emergencyActive,
        students,
        loading,
        refreshing,
        toggleEmergency,
        fetchData,
        refresh,
        getGroupedStudents,
    };
};
