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
                {value || 'Ninguno'}
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
                                {student.names?.[0]}{student.paternal_last_name?.[0]}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{student.names} {student.paternal_last_name}</Text>
                        <Text style={styles.studentId}>ID: {student.id}</Text>
                        <View style={styles.groupBadge}>
                            <MaterialCommunityIcons name="account-group" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.groupText}>{student.group || 'Sin Grupo'}</Text>
                        </View>
                    </View>
                </View>

                {/* Information Cards */}
                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="account-details" size={24} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Información Personal</Text>
                    </View>
                    <InfoRow label="Nombre Completo" value={`${student.names} ${student.paternal_last_name} ${student.maternal_last_name || ''}`} icon="account" />
                    <InfoRow label="Fecha de Nacimiento" value={student.birth_date} icon="calendar" />
                    <InfoRow label="Tipo de Sangre" value={student.blood_type} icon="water" isMedical />
                </Card>

                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="medical-bag" size={24} color={COLORS.danger} />
                        <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>Información Médica</Text>
                    </View>
                    <InfoRow label="Alergias" value={student.allergies} icon="alert-circle-outline" isMedical />
                    <InfoRow label="Enfermedades Crónicas" value={student.chronic_conditions} icon="hospital-box-outline" isMedical />
                </Card>

                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="phone" size={24} color={COLORS.success} />
                        <Text style={[styles.sectionTitle, { color: COLORS.success }]}>Información de Contacto</Text>
                    </View>
                    <InfoRow label="Teléfono del Estudiante" value={student.phone_number} icon="cellphone" />
                    <InfoRow label="Teléfono del Tutor" value={student.guardian_phone} icon="account-supervisor" />
                </Card>

                <Button
                    title="Cerrar"
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
