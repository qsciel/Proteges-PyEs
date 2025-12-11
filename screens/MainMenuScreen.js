import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, SPACING, FONTS, LAYOUT, SHADOWS } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MainMenuScreen({ navigation }) {
    const { user, logout } = useContext(AuthContext);

    const menuItems = [
        {
            title: 'Medical Consult',
            icon: 'medical-bag',
            screen: 'Scanner',
            description: 'View student health info',
            color: COLORS.primary
        },
        {
            title: 'Emergency',
            icon: 'alert-circle',
            screen: 'Emergency',
            description: 'Monitor safety status',
            color: COLORS.danger
        },
    ];

    if (user?.role === 'Admin' || user?.role === 'SuperUser') {
        menuItems.push({
            title: 'Admin Panel',
            icon: 'shield-account',
            screen: 'Admin',
            description: 'Manage users & settings',
            color: COLORS.warning
        });
    }

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>
                                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.greeting}>Welcome back,</Text>
                            <Text style={styles.username}>{user?.nombre || 'User'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <MaterialCommunityIcons name="logout" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Dashboard</Text>

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
        paddingBottom: 120, // Extra padding for bottom tab bar
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        marginTop: SPACING.m,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarText: {
        fontSize: 20,
        color: COLORS.primary,
        ...FONTS.bold,
    },
    greeting: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    username: {
        fontSize: 20,
        color: COLORS.text,
        ...FONTS.bold,
    },
    logoutButton: {
        padding: SPACING.s,
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: 18,
        color: COLORS.textLight,
        ...FONTS.bold,
        marginBottom: SPACING.m,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    grid: {
        gap: SPACING.m,
    },
    gridItem: {
        marginBottom: SPACING.m,
        ...SHADOWS.medium,
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.l,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.l,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: LAYOUT.radius.m,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 20,
        color: COLORS.text,
        ...FONTS.bold,
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});
