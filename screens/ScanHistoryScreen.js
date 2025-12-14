import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../theme';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';

export default function ScanHistoryScreen() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await api.getScanHistory();
            if (data) setHistory(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={[styles.container, { justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={styles.title}>Historial de Escaneos (Emergencia)</Text>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {history.length === 0 ? (
                    <Text style={styles.emptyText}>No hay registros de escaneo.</Text>
                ) : (
                    history.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name="qrcode-scan" size={24} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.studentId}>{item.student_name || item.student_id}</Text>
                                <Text style={styles.info}>Consultado por: {item.user_name || item.user_id}</Text>
                                <Text style={styles.time}>{new Date(item.scan_time).toLocaleString()}</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: SPACING.m, backgroundColor: COLORS.primary },
    title: { color: COLORS.surface, fontSize: 20, fontWeight: 'bold' },
    list: { padding: SPACING.m },
    card: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.m, marginBottom: SPACING.s, elevation: 2, alignItems: 'center' },
    iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceWithOpacity, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.m },
    studentId: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    info: { fontSize: 14, color: COLORS.textSecondary },
    time: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.xl },
});
