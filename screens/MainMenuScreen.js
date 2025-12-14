import React, { useContext } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, SPACING, FONTS, LAYOUT, SHADOWS } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

export default function MainMenuScreen({ navigation }) {
    const { user, logout } = useContext(AuthContext);

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
            title: 'Historial',
            icon: 'history',
            screen: 'ScanHistory',
            description: 'Registro de escaneos',
            color: COLORS.textSecondary
        },
    ];

    // Stats State
    const [stats, setStats] = React.useState({ students: '--', emergencies: 0, system: 'OK' });

    useFocusEffect(
        React.useCallback(() => {
            fetchStats();
        }, [])
    );

    const fetchStats = async () => {
        try {
            const data = await api.getStats();
            if (data) {
                setStats({
                    students: data.total_students || '--',
                    emergencies: data.total_scans || 0, // Using scans as proxy for activity
                    system: 'OK'
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
    }

    const date = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Modern Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.dateText}>{date.charAt(0).toUpperCase() + date.slice(1)}</Text>
                        <Text style={styles.username}>{user?.display_name || 'Usuario'}</Text>
                        <View style={styles.roleTag}>
                            <Text style={styles.roleText}>{user?.role || 'Invitado'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>

                {/* Dashboard Stats */}
                <Text style={styles.sectionTitle}>Resumen</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                        <MaterialCommunityIcons name="school" size={24} color={COLORS.white} />
                        <Text style={styles.statNumber}>{stats.students}</Text>
                        <Text style={styles.statLabel}>Estudiantes</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
                        <MaterialCommunityIcons name="alert-circle" size={24} color={COLORS.title} />
                        <Text style={[styles.statNumber, { color: COLORS.title }]}>{stats.emergencies}</Text>
                        <Text style={[styles.statLabel, { color: COLORS.title }]}>Escaneos</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }]}>
                        <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.text} />
                        <Text style={[styles.statNumber, { color: COLORS.text }]}>{stats.system}</Text>
                        <Text style={[styles.statLabel, { color: COLORS.text }]}>Sistema</Text>
                    </View>
                </ScrollView>

                <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.gridItem}
                            onPress={() => navigation.navigate(item.screen)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                                    <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardDescription}>{item.description}</Text>
                                </View>
                                <View style={[styles.arrowBtn, { backgroundColor: COLORS.background }]}>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.textSecondary} />
                                </View>
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
        paddingBottom: 120, // Extra padding for bottom tab bar
    },
    header: {
        marginBottom: SPACING.l,
        marginTop: SPACING.s,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    dateText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        ...FONTS.medium,
    },
    username: {
        fontSize: 28,
        color: COLORS.text,
        ...FONTS.bold,
        marginBottom: 8,
    },
    roleTag: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: COLORS.primary,
        fontSize: 12,
        ...FONTS.bold,
    },
    logoutButton: {
        padding: 10,
        backgroundColor: COLORS.danger + '10',
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        color: COLORS.text,
        ...FONTS.bold,
        marginBottom: SPACING.m,
        marginLeft: 4,
    },
    statsContainer: {
        marginBottom: SPACING.xl,
        flexDirection: 'row',
    },
    statCard: {
        width: 120,
        padding: SPACING.m,
        borderRadius: 16,
        marginRight: SPACING.m,
        ...SHADOWS.small,
        justifyContent: 'space-between',
        height: 100,
    },
    statNumber: {
        fontSize: 24,
        color: COLORS.white,
        ...FONTS.bold,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.white,
        opacity: 0.9,
    },
    grid: {
        gap: SPACING.m,
    },
    gridItem: {
        marginBottom: SPACING.s,
        ...SHADOWS.small,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 14,
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
        marginBottom: 2,
    },
    cardDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    arrowBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
