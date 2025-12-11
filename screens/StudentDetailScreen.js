import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import Button from '../components/Button';
import { COLORS, SPACING, FONTS, SHADOWS, LAYOUT } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StudentDetailScreen({ navigation, route }) {
    const { student } = route.params;

    const InfoRow = ({ label, value, icon, isMedical = false }) => (
        <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
                {icon && <MaterialCommunityIcons name={icon} size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />}
                <Text style={styles.label}>{label}</Text>
            </View>
            <Text style={[
                styles.value,
                isMedical && !value && styles.none,
                isMedical && value && styles.medicalValue
            ]}>
                {value || 'None'}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Student Header - Redesigned for white theme */}
                <View style={styles.headerCard}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>
                                {student.nombre.charAt(0)}{student.apellido_paterno.charAt(0)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{student.nombre} {student.apellido_paterno}</Text>
                        <Text style={styles.studentId}>ID: {student.id}</Text>
                        <View style={styles.groupBadge}>
                            <MaterialCommunityIcons name="account-group" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.groupText}>{student.grupo || 'No Group'}</Text>
                        </View>
                    </View>
                </View>

                {/* Information Cards */}
                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="account-details" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                    </View>
                    <InfoRow label="Full Name" value={`${student.nombre} ${student.apellido_paterno} ${student.apellido_materno || ''}`} icon="account" />
                    <InfoRow label="Date of Birth" value={student.fecha_nacimiento} icon="calendar" />
                    <InfoRow label="Blood Type" value={student.tipo_de_sangre} icon="water" isMedical />
                </Card>

                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="medical-bag" size={24} color={COLORS.danger} />
                        <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>Medical Information</Text>
                    </View>
                    <InfoRow label="Allergies" value={student.alergias} icon="alert-circle-outline" isMedical />
                    <InfoRow label="Chronic Conditions" value={student.enfermedades_cronicas} icon="hospital-box-outline" isMedical />
                </Card>

                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="phone" size={24} color={COLORS.success} />
                        <Text style={[styles.sectionTitle, { color: COLORS.success }]}>Contact Information</Text>
                    </View>
                    <InfoRow label="Student Phone" value={student.numero_telefono} icon="cellphone" />
                    <InfoRow label="Guardian Phone" value={student.numero_tutor} icon="account-supervisor" />
                </Card>

                <Button
                    title="Close"
                    onPress={() => navigation.goBack()}
                    variant="outline"
                    style={styles.backButton}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: SPACING.l,
        paddingBottom: 100,
    },
    headerCard: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.l,
        marginBottom: SPACING.l,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    avatarWrapper: {
        marginBottom: SPACING.m,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    avatarText: {
        fontSize: 32,
        color: COLORS.primary,
        ...FONTS.bold,
    },
    studentInfo: {
        alignItems: 'center',
    },
    studentName: {
        fontSize: 24,
        color: COLORS.text,
        ...FONTS.h2,
        marginBottom: 4,
        textAlign: 'center',
    },
    studentId: {
        fontSize: 14,
        color: COLORS.textSecondary,
        ...FONTS.medium,
        marginBottom: SPACING.s,
    },
    groupBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: SPACING.m,
        paddingVertical: 6,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    groupText: {
        color: COLORS.primary,
        ...FONTS.semiBold,
        fontSize: 13,
    },
    card: {
        marginBottom: SPACING.m,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
        paddingBottom: SPACING.s,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: 18,
        color: COLORS.text,
        ...FONTS.bold,
        marginLeft: SPACING.s,
    },
    infoRow: {
        marginBottom: SPACING.m,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: 13,
        color: COLORS.textSecondary,
        ...FONTS.medium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 16,
        color: COLORS.text,
        ...FONTS.regular,
        paddingLeft: 24,
    },
    medicalValue: {
        color: COLORS.danger,
        ...FONTS.semiBold,
    },
    none: {
        fontStyle: 'italic',
        color: COLORS.textSecondary,
        opacity: 0.7,
    },
    backButton: {
        marginTop: SPACING.m,
        marginBottom: SPACING.xl,
    },
});
