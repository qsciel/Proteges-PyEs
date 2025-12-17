import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SPACING, FONTS, LAYOUT, SHADOWS } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import api from '../services/api';

import { usePushNotifications } from '../hooks/usePushNotifications';
import * as Device from 'expo-device';

export default function ParentPortalScreen({ navigation }) {
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Notifications Hook
    const { expoPushToken, registerTokenBackend } = usePushNotifications();
    const [subscribing, setSubscribing] = useState(false);

    const handleSubscribe = async () => {
        if (!studentData?.student?.id_control_escolar) return;

        setSubscribing(true);
        // Wait a bit for token if not ready (simple retry logic could be added)
        if (!expoPushToken) {
            Alert.alert("Error", "No se pudo obtener el token del dispositivo. Asegúrese de permitir notificaciones.");
            setSubscribing(false);
            return;
        }

        try {
            await registerTokenBackend(studentData.student.id_control_escolar, Device.modelName);
            Alert.alert("Éxito", "Dispositivo suscrito para recibir notificaciones de este estudiante.");
        } catch (e) {
            Alert.alert("Error", "No se pudo suscribir.");
        } finally {
            setSubscribing(false);
        }
    };

    const searchStudent = async () => {
        if (!studentId.trim()) {
            setError('Por favor ingrese una matrícula');
            return;
        }

        setLoading(true);
        setError('');
        setStudentData(null);

        try {
            const data = await api.getStudentPortalInfo(studentId.trim());
            setStudentData(data);
        } catch (e) {
            setError('No se encontró el estudiante o hubo un error');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Portal para Padres</Text>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.searchSection}>
                    <MaterialCommunityIcons name="account-search" size={60} color={COLORS.primary} />
                    <Text style={styles.subtitle}>Consulte información de su hijo/a</Text>
                    <Text style={styles.description}>Ingrese el ID del estudiante para ver su información</Text>

                    <View style={styles.searchBox}>
                        <TextInput
                            style={styles.input}
                            value={studentId}
                            onChangeText={setStudentId}
                            placeholder="ID del estudiante (ej: 2765432101)"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="default"
                        />
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={searchStudent}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <MaterialCommunityIcons name="magnify" size={24} color={COLORS.white} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {error ? (
                        <View style={styles.errorBox}>
                            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}
                </View>

                {studentData && (
                    <View style={styles.resultsSection}>
                        {/* Student Info Card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="account-circle" size={40} color={COLORS.primary} />
                                <View style={{ flex: 1, marginLeft: SPACING.m }}>
                                    <Text style={styles.studentName}>{studentData.student.nombres} {studentData.student.apellido_paterno}</Text>
                                    <Text style={styles.studentDetail}>ID: {studentData.student.id_control_escolar}</Text>
                                    <Text style={styles.studentDetail}>Grupo: {studentData.student.grupo}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Emergency Status */}
                        {studentData.emergency_status && (
                            <View style={[styles.card, { backgroundColor: studentData.emergency_status.scanned ? COLORS.success + '10' : COLORS.danger + '10', borderColor: studentData.emergency_status.scanned ? COLORS.success : COLORS.danger }]}>
                                <View style={styles.emergencyHeader}>
                                    <MaterialCommunityIcons
                                        name={studentData.emergency_status.scanned ? "shield-check" : "alert-octagon"}
                                        size={32}
                                        color={studentData.emergency_status.scanned ? COLORS.success : COLORS.danger}
                                    />
                                    <Text style={[styles.emergencyTitle, { color: studentData.emergency_status.scanned ? COLORS.success : COLORS.danger }]}>
                                        EMERGENCIA ACTIVA
                                    </Text>
                                </View>
                                <Text style={[styles.emergencyStatus, { color: studentData.emergency_status.scanned ? COLORS.success : COLORS.danger }]}>
                                    Estado: {studentData.emergency_status.scanned ? 'SEGURO ✓' : 'NO LOCALIZADO'}
                                </Text>
                                {!studentData.emergency_status.scanned && (
                                    <Text style={styles.emergencyNote}>Si su hijo/a se encuentra con usted, favor de comunicarse con la escuela.</Text>
                                )}
                            </View>
                        )}

                        {/* Attendance History */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Historial de Asistencias (últimos 30 días)</Text>
                            {studentData.attendance && studentData.attendance.length > 0 ? (
                                studentData.attendance.slice(0, 10).map((record, index) => (
                                    <View key={index} style={styles.attendanceItem}>
                                        <View style={[styles.statusDot, { backgroundColor: record.presente ? COLORS.success : COLORS.warning }]} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.attendanceDate}>
                                                {new Date(record.fecha_asistencia).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </Text>
                                            <Text style={styles.attendanceTime}>
                                                {new Date(record.fecha_asistencia).toLocaleTimeString('es-ES', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })} - {record.salon_clase}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: record.presente ? COLORS.success : COLORS.warning }]}>
                                            <Text style={styles.statusText}>{record.presente ? 'ENTRADA' : 'SALIDA'}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noDataText}>No hay registros de asistencia</Text>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: COLORS.primary,
        padding: SPACING.l,
        paddingTop: SPACING.xl,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: SPACING.m,
    },
    title: {
        fontSize: 24,
        ...FONTS.bold,
        color: COLORS.white,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: SPACING.l,
    },
    searchSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    subtitle: {
        fontSize: 20,
        ...FONTS.semiBold,
        color: COLORS.text,
        marginTop: SPACING.m,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: SPACING.s,
        textAlign: 'center',
        marginBottom: SPACING.l,
    },
    searchBox: {
        flexDirection: 'row',
        width: '100%',
        gap: SPACING.m,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        borderWidth: 2,
        borderColor: COLORS.border,
        fontSize: 16,
        ...FONTS.medium,
    },
    searchButton: {
        backgroundColor: COLORS.primary,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        width: 56,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.medium,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.danger + '10',
        borderRadius: LAYOUT.radius.s,
        padding: SPACING.m,
        marginTop: SPACING.m,
        gap: SPACING.s,
    },
    errorText: {
        color: COLORS.danger,
        ...FONTS.medium,
    },
    resultsSection: {
        gap: SPACING.m,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.l,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    studentName: {
        fontSize: 20,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    studentDetail: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    subscribeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: LAYOUT.radius.m,
        marginTop: SPACING.m,
        alignSelf: 'flex-start',
        gap: SPACING.s,
        ...SHADOWS.small,
    },
    subscribeText: {
        color: COLORS.white,
        fontSize: 14,
        ...FONTS.semiBold,
    },
    justificationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: LAYOUT.radius.m,
        marginTop: SPACING.m,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: COLORS.primary,
        gap: SPACING.s,
        ...SHADOWS.small,
    },
    justificationText: {
        color: COLORS.primary,
        fontSize: 14,
        ...FONTS.semiBold,
    },
    emergencyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
        marginBottom: SPACING.m,
    },
    emergencyTitle: {
        fontSize: 18,
        ...FONTS.bold,
    },
    emergencyStatus: {
        fontSize: 16,
        ...FONTS.semiBold,
        marginBottom: SPACING.s,
    },
    emergencyNote: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 18,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    attendanceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: SPACING.m,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    attendanceDate: {
        fontSize: 14,
        ...FONTS.semiBold,
        color: COLORS.text,
    },
    attendanceTime: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        borderRadius: LAYOUT.radius.s,
    },
    statusText: {
        color: COLORS.white,
        fontSize: 10,
        ...FONTS.bold,
    },
    noDataText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: 14,
        padding: SPACING.l,
    },
});
