import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Vibration } from 'react-native';
import { COLORS, SPACING, FONTS } from '../theme';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';

// Mock Classroom options
const CLASSROOMS = ['5APM', '5AEM', '3BPM', '1APM'];

export default function AttendanceScreen({ navigation }) {
    const [mode, setMode] = useState('scan'); // 'scan', 'history'
    const [scannedId, setScannedId] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('5APM');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    // Focus input on mount for external scanners
    useEffect(() => {
        if (mode === 'scan') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        if (mode === 'history') {
            fetchHistory();
        }
    }, [mode]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await api.getAttendanceHistory();
            if (data) setHistory(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (text) => {
        setScannedId(text);
        // If length matches ID format (e.g. 8-10 chars), auto-submit
        if (text.length >= 8) {
            submitAttendance(text);
        }
    };

    const submitAttendance = async (id) => {
        if (loading) return;
        setLoading(true);
        Vibration.vibrate(50);

        try {
            await api.registerAttendance(id, true);
            Alert.alert('Asistencia Registrada', `ID: ${id}`);
            setScannedId('');
        } catch (e) {
            Alert.alert('Error', 'Fallo al registrar asistencia');
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 500);
        }
    };

    const renderScanner = () => (
        <View style={styles.scanContainer}>
            <View style={styles.classroomSelector}>
                <Text style={styles.label}>Salón Actual:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CLASSROOMS.map(c => (
                        <TouchableOpacity
                            key={c}
                            style={[styles.classBadge, selectedClassroom === c && styles.classBadgeActive]}
                            onPress={() => setSelectedClassroom(c)}
                        >
                            <Text style={[styles.classText, selectedClassroom === c && styles.classTextActive]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    ref={inputRef}
                    style={styles.hiddenInput}
                    value={scannedId}
                    onChangeText={handleScan}
                    placeholder="Escaneando..."
                    autoFocus
                    showSoftInputOnFocus={false} // Hide keyboard for hardware scanner
                />
                <MaterialCommunityIcons name="remote" size={80} color={COLORS.primary} />
                <Text style={styles.scanInstruction}>Escanee Tarjeta RFID</Text>
                <Text style={styles.scannedText}>{scannedId}</Text>
            </View>

            <TouchableOpacity style={styles.manualButton} onPress={() => submitAttendance(scannedId)}>
                <Text style={styles.manualButtonText}>Registrar Manualmente</Text>
            </TouchableOpacity>
        </View>
    );

    const renderHistory = () => (
        <ScrollView style={styles.historyContainer}>
            {history.map((record) => (
                <View key={record.id_asistencia} style={styles.historyItem}>
                    <View style={styles.historyIcon}>
                        <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.historyId}>{record.id_control_escolar}</Text>
                        <Text style={styles.historyTime}>{new Date(record.fecha_asistencia).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.historyClass}>{record.salon_clase}</Text>
                </View>
            ))}
        </ScrollView>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={styles.title}>Control de Asistencias</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity onPress={() => setMode('scan')} style={[styles.tab, mode === 'scan' && styles.activeTab]}>
                    <Text style={[styles.tabText, mode === 'scan' && styles.activeTabText]}>Escaner</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('history')} style={[styles.tab, mode === 'history' && styles.activeTab]}>
                    <Text style={[styles.tabText, mode === 'history' && styles.activeTabText]}>Historial</Text>
                </TouchableOpacity>
            </View>

            {mode === 'scan' ? renderScanner() : renderHistory()}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: { padding: SPACING.m, backgroundColor: COLORS.primary },
    title: { color: COLORS.surface, fontSize: 20, fontWeight: 'bold' },
    tabs: { flexDirection: 'row', backgroundColor: COLORS.surface },
    tab: { flex: 1, padding: SPACING.m, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: COLORS.primary },
    tabText: { color: COLORS.textSecondary, fontWeight: 'bold' },
    activeTabText: { color: COLORS.primary },

    scanContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.l },
    classroomSelector: { height: 60, marginBottom: SPACING.xl },
    label: { fontSize: 16, marginBottom: SPACING.s, textAlign: 'center', color: COLORS.textSecondary },
    classBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surfaceWithOpacity, marginRight: 8, justifyContent: 'center' },
    classBadgeActive: { backgroundColor: COLORS.primary },
    classText: { color: COLORS.text },
    classTextActive: { color: COLORS.surface, fontWeight: 'bold' },

    inputContainer: { alignItems: 'center', marginBottom: SPACING.xl },
    hiddenInput: { height: 0, width: 0, opacity: 0 },
    scanInstruction: { marginTop: SPACING.m, fontSize: 18, color: COLORS.textSecondary },
    scannedText: { fontSize: 24, fontWeight: 'bold', marginTop: SPACING.s, color: COLORS.text },

    manualButton: { padding: SPACING.m, backgroundColor: COLORS.primary, borderRadius: 8 },
    manualButtonText: { color: COLORS.surface, fontWeight: 'bold' },

    historyContainer: { flex: 1, padding: SPACING.m },
    historyItem: { flexDirection: 'row', padding: SPACING.m, backgroundColor: COLORS.surface, marginBottom: SPACING.s, borderRadius: 8, alignItems: 'center', elevation: 2 },
    historyIcon: { marginRight: SPACING.m },
    historyId: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    historyTime: { fontSize: 14, color: COLORS.textSecondary },
    historyClass: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
});
