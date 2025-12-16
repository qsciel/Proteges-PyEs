import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, FONTS } from '../theme';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';

export default function AttendanceScreen({ navigation, route }) {
    const initialTab = route?.params?.initialTab || 'scan';
    const [mode, setMode] = useState(initialTab); // 'scan', 'history', 'camera'
    const [permission, requestPermission] = useCameraPermissions();
    const [scannedId, setScannedId] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('5APM');
    const [classrooms, setClassrooms] = useState(['5APM', '5AEM']); // Will be loaded from API
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanned, setScanned] = useState(false);
    const inputRef = useRef(null);

    // Fetch classrooms on mount
    useEffect(() => {
        const loadClassrooms = async () => {
            try {
                const grupos = await api.getGroups();
                if (grupos && grupos.length > 0) {
                    const nomenclaturas = grupos.map(g => g.id_nomenclatura);
                    setClassrooms(nomenclaturas);
                    setSelectedClassroom(nomenclaturas[0]);
                }
            } catch (e) {
                console.error('Failed to load classrooms:', e);
            }
        };
        loadClassrooms();
    }, []);

    // Focus input on mount for external scanners
    useEffect(() => {
        let interval;
        if (mode === 'scan') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        if (mode === 'history') {
            fetchHistory(); // Initial fetch
            interval = setInterval(fetchHistory, 5000); // Poll every 5 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
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

    const handleManualInput = () => {
        Alert.prompt(
            'Registrar Asistencia Manual',
            'Ingrese el ID del estudiante o escanee su código QR:',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Registrar',
                    onPress: (id) => {
                        if (id && id.trim()) {
                            submitAttendance(id.trim());
                        }
                    }
                }
            ],
            'plain-text',
            scannedId
        );
    };

    const submitAttendance = async (id) => {
        if (loading) return;
        setLoading(true);
        Vibration.vibrate(50);

        try {
            // Use current user ID if available, else default to 1
            // Use selectedClassroom from state
            const response = await api.registerAttendance(id, true, selectedClassroom, 1);
            const msg = response.type ? `${response.type} EXITOSA` : 'Asistencia Registrada';
            Alert.alert(msg, `ID: ${id}`);
            setScannedId('');
            // If in camera mode, we don't automatically close it, but we reset scanned flag after alert
            if (mode === 'camera') {
                setTimeout(() => setScanned(false), 2000);
            }
        } catch (e) {
            Alert.alert('Error', 'Fallo al registrar asistencia');
            if (mode === 'camera') setScanned(false);
        } finally {
            setLoading(false);
            if (mode === 'scan') setTimeout(() => inputRef.current?.focus(), 500);
        }
    };

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned || loading) return;
        setScanned(true);
        submitAttendance(data);
    };

    const startCamera = async () => {
        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para escanear QR.');
                return;
            }
        }
        setMode('camera');
        setScanned(false);
    };

    const renderScanner = () => (
        <View style={styles.scanContainer}>
            <View style={styles.classroomSelector}>
                <Text style={styles.label}>Salón Actual:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {classrooms.map(c => (
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

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cameraButton} onPress={startCamera}>
                    <MaterialCommunityIcons name="qrcode-scan" size={24} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.cameraButtonText}>Escanear QR</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.manualButton} onPress={handleManualInput}>
                    <Text style={styles.manualButtonText}>Registrar Manualmente</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderCamera = () => (
        <View style={styles.cameraContainer}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />
            {/* Overlay */}
            <View style={styles.overlay}>
                <View style={styles.overlayHeader}>
                    <Text style={styles.overlayText}>Escanee el Código QR del Estudiante</Text>
                </View>
                <View style={styles.overlayCenter}>
                    <View style={styles.finder} />
                </View>
                <View style={styles.overlayFooter}>
                    <TouchableOpacity style={styles.closeCameraButton} onPress={() => setMode('scan')}>
                        <Text style={styles.closeCameraText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderHistory = () => (
        <ScrollView style={styles.historyContainer}>
            {history.length === 0 ? (
                <Text style={styles.emptyText}>No hay registros de asistencia.</Text>
            ) : (
                history.map((record) => {
                    const isEntrada = record.salon_clase === 'ENTRADA';
                    const statusColor = isEntrada ? COLORS.success : COLORS.warning;
                    const statusIcon = isEntrada ? 'login' : 'logout';

                    return (
                        <View key={record.id_asistencia} style={styles.historyItem}>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                <MaterialCommunityIcons name={statusIcon} size={20} color="white" />
                            </View>
                            <View style={styles.historyContent}>
                                <Text style={styles.historyName}>{record.nombre_completo}</Text>
                                <Text style={styles.historyId}>ID: {record.id_control_escolar}</Text>
                                <Text style={styles.historyTime}>
                                    {new Date(record.fecha_asistencia).toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </View>
                            <View style={[styles.statusLabel, { backgroundColor: statusColor + '20' }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {record.salon_clase}
                                </Text>
                            </View>
                        </View>
                    );
                })
            )}
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

            {mode === 'scan' ? renderScanner() : mode === 'history' ? renderHistory() : renderCamera()}
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

    buttonRow: { width: '100%', gap: 10 },
    cameraButton: { flexDirection: 'row', padding: SPACING.m, backgroundColor: COLORS.secondary, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cameraButtonText: { color: COLORS.surface, fontWeight: 'bold' },
    manualButton: { padding: SPACING.m, backgroundColor: COLORS.primary, borderRadius: 8, alignItems: 'center' },
    manualButtonText: { color: COLORS.surface, fontWeight: 'bold' },


    historyContainer: { flex: 1, padding: SPACING.m },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.xl, fontSize: 16 },
    historyItem: {
        flexDirection: 'row',
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        marginBottom: SPACING.m,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary
    },
    statusBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    historyContent: { flex: 1 },
    historyName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
    historyId: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
    historyTime: { fontSize: 12, color: COLORS.textSecondary },
    statusLabel: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: { fontSize: 13, fontWeight: 'bold' },

    // Camera Styles
    cameraContainer: { flex: 1, backgroundColor: 'black' },
    overlay: { flex: 1, justifyContent: 'space-between' },
    overlayHeader: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    overlayText: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    overlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    finder: { width: 250, height: 250, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 20 },
    overlayFooter: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    closeCameraButton: { padding: 15, backgroundColor: 'white', borderRadius: 30, paddingHorizontal: 30 },
    closeCameraText: { color: 'black', fontWeight: 'bold' },
});
