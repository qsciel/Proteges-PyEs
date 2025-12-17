import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Vibration, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, FONTS, LAYOUT, SHADOWS } from '../theme';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';

export default function AttendanceScreen({ navigation, route }) {
    const initialTab = route?.params?.initialTab || 'scan';
    const [mode, setMode] = useState(initialTab);
    const [permission, requestPermission] = useCameraPermissions();
    const [scannedId, setScannedId] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('5APM');
    const [classrooms, setClassrooms] = useState(['5APM', '5AEM']);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanned, setScanned] = useState(false);
    const inputRef = useRef(null);

    // Modal para registro manual
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualId, setManualId] = useState('');

    useEffect(() => {
        const loadClassrooms = async () => {
            try {
                const grupos = await api.getGroups();
                if (grupos && grupos.length > 0) {
                    const nomenclaturas = grupos.map(g => g.id || g.id_nomenclatura);
                    setClassrooms(nomenclaturas);
                    setSelectedClassroom(nomenclaturas[0]);
                }
            } catch (e) {
                console.error('Failed to load classrooms:', e);
            }
        };
        loadClassrooms();
    }, []);

    useEffect(() => {
        let interval;
        if (mode === 'scan') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        if (mode === 'history') {
            fetchHistory();
            interval = setInterval(fetchHistory, 10000);
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
        if (text.length >= 8) {
            submitAttendance(text);
        }
    };

    const openManualModal = () => {
        setManualId('');
        setShowManualModal(true);
    };

    const submitManualAttendance = () => {
        if (manualId.trim()) {
            submitAttendance(manualId.trim());
            setShowManualModal(false);
        } else {
            Alert.alert('Error', 'Ingrese un ID válido');
        }
    };

    const submitAttendance = async (id) => {
        if (loading) return;
        setLoading(true);
        Vibration.vibrate(50);

        try {
            const response = await api.registerAttendance(id, true, selectedClassroom, 1);
            const msg = response.type ? `${response.type} EXITOSA` : 'Asistencia Registrada';
            Alert.alert(msg, `ID: ${id}`);
            setScannedId('');
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
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedClassroom}
                        onValueChange={(itemValue) => setSelectedClassroom(itemValue)}
                        style={styles.picker}
                    >
                        {classrooms.map(c => (
                            <Picker.Item key={c} label={c} value={c} />
                        ))}
                    </Picker>
                </View>
            </View>

            <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="qrcode-scan" size={80} color={COLORS.primary} />
                <TextInput
                    ref={inputRef}
                    style={styles.hiddenInput}
                    value={scannedId}
                    onChangeText={handleScan}
                    autoFocus
                    keyboardType="default"
                />
                <Text style={styles.scanInstruction}>Escanee el código RFID o QR</Text>
                {scannedId ? <Text style={styles.scannedText}>{scannedId}</Text> : null}
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cameraButton} onPress={startCamera}>
                    <MaterialCommunityIcons name="camera" size={20} color={COLORS.white} />
                    <Text style={styles.cameraButtonText}>  Usar Cámara QR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.manualButton} onPress={openManualModal}>
                    <MaterialCommunityIcons name="keyboard" size={20} color={COLORS.white} />
                    <Text style={styles.manualButtonText}>  Registro Manual</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderCamera = () => (
        <View style={styles.cameraContainer}>
            <CameraView
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            >
                <View style={styles.overlay}>
                    <View style={styles.overlayHeader}>
                        <Text style={styles.overlayText}>Escanee el código QR del estudiante</Text>
                    </View>
                    <View style={styles.overlayCenter}>
                        <View style={styles.finder} />
                    </View>
                    <View style={styles.overlayFooter}>
                        <TouchableOpacity style={styles.closeCameraButton} onPress={() => setMode('scan')}>
                            <Text style={styles.closeCameraText}>Cerrar Cámara</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </View>
    );

    const renderHistory = () => (
        <ScrollView style={styles.historyContainer}>
            {history.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="clipboard-text-off-outline" size={80} color={COLORS.textSecondary} />
                    <Text style={styles.emptyText}>No hay registros de asistencia</Text>
                </View>
            ) : (
                history.map((record) => {
                    const isEntrada = record.presente === true;
                    const statusColor = isEntrada ? COLORS.success : COLORS.warning;
                    const statusIcon = isEntrada ? 'login-variant' : 'logout-variant';
                    const statusText = isEntrada ? 'ENTRADA' : 'SALIDA';

                    return (
                        <View key={record.id_asistencia} style={styles.historyCard}>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                <MaterialCommunityIcons name={statusIcon} size={28} color={COLORS.white} />
                                <Text style={styles.badgeLabel}>{statusText}</Text>
                            </View>
                            <View style={styles.historyContent}>
                                <Text style={styles.historyName}>{record.nombre_completo}</Text>
                                <View style={styles.detailRow}>
                                    <MaterialCommunityIcons name="card-account-details" size={16} color={COLORS.textSecondary} />
                                    <Text style={styles.historyDetail}>ID: {record.id_control_escolar}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <MaterialCommunityIcons name="door" size={16} color={COLORS.textSecondary} />
                                    <Text style={styles.historyDetail}>Salón: {record.salon_clase}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.textSecondary} />
                                    <Text style={styles.historyDetail}>
                                        {new Date(record.fecha_asistencia).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </View>
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

            {/* Tabs Mejorados */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    onPress={() => setMode('scan')}
                    style={[styles.tab, mode === 'scan' && styles.activeTab]}
                >
                    <MaterialCommunityIcons
                        name="qrcode-scan"
                        size={24}
                        color={mode === 'scan' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text style={[styles.tabText, mode === 'scan' && styles.activeTabText]}>Escanear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setMode('history')}
                    style={[styles.tab, mode === 'history' && styles.activeTab]}
                >
                    <MaterialCommunityIcons
                        name="history"
                        size={24}
                        color={mode === 'history' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text style={[styles.tabText, mode === 'history' && styles.activeTabText]}>Historial</Text>
                </TouchableOpacity>
            </View>

            {mode === 'scan' ? renderScanner() : mode === 'history' ? renderHistory() : renderCamera()}

            {/* Modal de Registro Manual */}
            <Modal
                visible={showManualModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowManualModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Registro Manual</Text>
                        <Text style={styles.modalSubtitle}>Ingrese el ID del estudiante</Text>

                        <TextInput
                            style={styles.modalInput}
                            value={manualId}
                            onChangeText={setManualId}
                            placeholder="ID del estudiante"
                            keyboardType="default"
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setShowManualModal(false)}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonConfirm]}
                                onPress={submitManualAttendance}
                            >
                                <Text style={styles.modalButtonText}>Registrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: SPACING.l,
        backgroundColor: COLORS.primary,
        paddingTop: SPACING.xl,
    },
    title: {
        color: COLORS.white,
        fontSize: 24,
        ...FONTS.bold,
    },

    // Tabs mejorados
    tabs: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        ...SHADOWS.small,
    },
    tab: {
        flex: 1,
        padding: SPACING.m,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
        gap: 4,
    },
    activeTab: {
        borderBottomColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    tabText: {
        color: COLORS.textSecondary,
        ...FONTS.semiBold,
        fontSize: 13,
    },
    activeTabText: {
        color: COLORS.primary,
    },

    scanContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    classroomSelector: {
        marginBottom: SPACING.xl,
        width: '100%',
    },
    label: {
        fontSize: 16,
        marginBottom: SPACING.s,
        textAlign: 'center',
        color: COLORS.text,
        ...FONTS.semiBold,
    },
    pickerContainer: {
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: LAYOUT.radius.m,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    picker: {
        height: 50,
        width: '100%',
    },

    inputContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    hiddenInput: {
        height: 0,
        width: 0,
        opacity: 0,
    },
    scanInstruction: {
        marginTop: SPACING.l,
        fontSize: 16,
        color: COLORS.textSecondary,
        ...FONTS.medium,
    },
    scannedText: {
        fontSize: 20,
        ...FONTS.bold,
        marginTop: SPACING.s,
        color: COLORS.primary,
    },

    buttonRow: {
        width: '100%',
        gap: SPACING.m,
    },
    cameraButton: {
        flexDirection: 'row',
        padding: SPACING.m,
        backgroundColor: COLORS.secondary,
        borderRadius: LAYOUT.radius.m,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    cameraButtonText: {
        color: COLORS.white,
        ...FONTS.semiBold,
    },
    manualButton: {
        flexDirection: 'row',
        padding: SPACING.m,
        backgroundColor: COLORS.primary,
        borderRadius: LAYOUT.radius.m,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.medium,
    },
    manualButtonText: {
        color: COLORS.white,
        ...FONTS.semiBold,
    },

    // History mejorado
    historyContainer: {
        flex: 1,
        padding: SPACING.m,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: SPACING.xxl * 2,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: SPACING.m,
        fontSize: 16,
        ...FONTS.medium,
    },
    historyCard: {
        flexDirection: 'row',
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        marginBottom: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        ...SHADOWS.medium,
        gap: SPACING.m,
    },
    statusBadge: {
        width: 80,
        paddingVertical: SPACING.s,
        borderRadius: LAYOUT.radius.s,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    badgeLabel: {
        color: COLORS.white,
        fontSize: 11,
        ...FONTS.bold,
    },
    historyContent: {
        flex: 1,
        gap: 6,
    },
    historyName: {
        fontSize: 16,
        ...FONTS.bold,
        color: COLORS.text,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    historyDetail: {
        fontSize: 13,
        color: COLORS.textSecondary,
        ...FONTS.medium,
    },

    // Camera
    cameraContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    overlayHeader: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    overlayText: {
        color: 'white',
        fontSize: 18,
        ...FONTS.bold,
        textAlign: 'center',
    },
    overlayCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    finder: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderColor: COLORS.primary,
        borderRadius: 20,
    },
    overlayFooter: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    closeCameraButton: {
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 30,
        paddingHorizontal: 30,
    },
    closeCameraText: {
        color: 'black',
        ...FONTS.bold,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 400,
        ...SHADOWS.large,
    },
    modalTitle: {
        fontSize: 22,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.l,
    },
    modalInput: {
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: LAYOUT.radius.s,
        padding: SPACING.m,
        fontSize: 16,
        marginBottom: SPACING.l,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    modalButton: {
        flex: 1,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.s,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    modalButtonConfirm: {
        backgroundColor: COLORS.primary,
    },
    modalButtonText: {
        color: COLORS.white,
        ...FONTS.semiBold,
    },
    modalButtonTextCancel: {
        color: COLORS.text,
        ...FONTS.semiBold,
    },
});
