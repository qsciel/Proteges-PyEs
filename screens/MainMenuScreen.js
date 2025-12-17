import React, { useContext } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, SPACING, FONTS, LAYOUT, SHADOWS } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

export default function MainMenuScreen({ navigation }) {
    const { user, logout } = useAuth();

    const menuItems = [
        {
            title: 'Consulta Médica',
            icon: 'medical-bag',
            screen: 'Scanner',
            description: 'Ver información de salud',
            color: COLORS.primary
        },
        {
            title: 'Emergencia',
            icon: 'alert-circle',
            screen: 'Emergency',
            description: 'Monitorear seguridad',
            color: COLORS.danger
        },
        {
            title: 'Control Asistencia',
            icon: 'calendar-check',
            screen: 'Attendance',
            description: 'Registro RFID',
            color: COLORS.secondary
        },
        {
            title: 'Historial Asistencia',
            icon: 'history',
            screen: 'Attendance',
            params: { initialTab: 'history' },
            description: 'Ver registros',
            color: COLORS.textSecondary
        },
    ];

    const [stats, setStats] = React.useState({ students: '--', emergencies: 0, system: 'OK' });

    useFocusEffect(
        React.useCallback(() => {
            fetchStats();
        }, [])
    );

    const fetchStats = async () => {
        try {
            const data = await api.getStats();
            const emergencyStatus = await api.getEmergencyStatus();
            if (data) {
                setStats({
                    students: data.total_students || '--',
                    emergencies: data.total_scans || 0,
                    system: emergencyStatus?.active ? 'EMERGENCIA' : 'OK'
                });
            }
        } catch (e) { console.error(e); }
    };

    const adminRoles = ['Director', 'Operador'];
    if (adminRoles.includes(user?.role)) {
        menuItems.push({
            title: 'Panel Admin',
            icon: 'shield-account',
            screen: 'Admin',
            description: 'Gestión de usuarios',
            color: COLORS.warning
        });
        menuItems.push({
            title: 'Justificantes',
            icon: 'file-document-check',
            screen: 'AdminJustifications',
            description: 'Revisar solicitudes',
            color: COLORS.info
        });
    }

    const date = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header mejorado */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.dateText}>{date.charAt(0).toUpperCase() + date.slice(1)}</Text>
                        <Text style={styles.username}>{user?.display_name || 'Usuario'}</Text>
                        <View style={styles.roleTag}>
                            <Text style={styles.roleText}>{user?.role || 'Invitado'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <MaterialCommunityIcons name="logout" size={22} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>

                {/* Stats Section - Mejorado para responsividad */}
                <Text style={styles.sectionTitle}>Resumen del Sistema</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.statsContainer}
                >
                    <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                        <MaterialCommunityIcons name="school" size={32} color={COLORS.white} />
                        <Text style={styles.statNumber}>{stats.students}</Text>
                        <Text style={styles.statLabel}>Estudiantes</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
                        <MaterialCommunityIcons name="qrcode-scan" size={32} color={COLORS.white} />
                        <Text style={styles.statNumber}>{stats.emergencies}</Text>
                        <Text style={styles.statLabel}>Escaneos</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: stats.system === 'EMERGENCIA' ? COLORS.danger : COLORS.success }]}>
                        <MaterialCommunityIcons
                            name={stats.system === 'EMERGENCIA' ? 'alert-circle' : 'check-circle'}
                            size={32}
                            color={COLORS.white}
                        />
                        <Text style={styles.statNumber}>{stats.system}</Text>
                        <Text style={styles.statLabel}>Estado</Text>
                    </View>
                </ScrollView>

                <Text style={styles.sectionTitle}>Acciones Principales</Text>

                {/* Menu Items - Más espaciados y claros */}
                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.gridItem}
                            onPress={() => navigation.navigate(item.screen, item.params || {})}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                                    <MaterialCommunityIcons name={item.icon} size={36} color={item.color} />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardDescription}>{item.description}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: SPACING.l,
        paddingBottom: 120,
    },
    header: {
        marginBottom: SPACING.xl,
        marginTop: SPACING.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flex: 1,
    },
    dateText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
        ...FONTS.medium,
    },
    username: {
        fontSize: 32,
        color: COLORS.text,
        ...FONTS.bold,
        marginBottom: SPACING.s,
    },
    roleTag: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: COLORS.primary,
        fontSize: 13,
        ...FONTS.bold,
    },
    logoutButton: {
        padding: 12,
        backgroundColor: COLORS.danger + '10',
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 20,
        color: COLORS.text,
        ...FONTS.bold,
        marginBottom: SPACING.m,
        marginTop: SPACING.s,
    },
    statsContainer: {
        paddingBottom: SPACING.m,
        marginBottom: SPACING.l,
    },
    statCard: {
        width: 140,
        padding: SPACING.l,
        borderRadius: LAYOUT.radius.m,
        marginRight: SPACING.m,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.medium,
        minHeight: 140,
    },
    statNumber: {
        fontSize: 28,
        color: COLORS.white,
        ...FONTS.bold,
        marginTop: SPACING.m,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: COLORS.white,
        opacity: 0.95,
        ...FONTS.medium,
    },
    grid: {
        gap: SPACING.m,
    },
    gridItem: {
        marginBottom: SPACING.s,
        ...SHADOWS.small,
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.l,
        minHeight: 80,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: LAYOUT.radius.m,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        color: COLORS.text,
        ...FONTS.bold,
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        ...FONTS.medium,
    },
});
