import React, { useState, useContext } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, LAYOUT, GRADIENTS, SHADOWS } from '../theme';
import ScannerOverlay from '../components/ScannerOverlay';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanMode, setScanMode] = useState(null); // 'medical' | 'emergency' | null
    const { user } = useContext(AuthContext);
    const insets = useSafeAreaInsets();

    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <MaterialCommunityIcons name="camera-off" size={64} color={COLORS.textSecondary} />
                <Text style={styles.permissionText}>Se requiere permiso de cámara</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Otorgar Permiso</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned) return;
        setScanned(true);

        const isQR = type === 'qr' || type === 256 || type === 'org.iso.QRCode';

        if (!isQR) {
            Alert.alert('Escáner Incorrecto', 'Solo se aceptan códigos QR.');
            setScanned(false);
            return;
        }

        try {
            if (scanMode === 'medical') {
                const student = await api.getStudent(data);
                navigation.navigate('StudentDetail', { student });
                setScanned(false);
                setScanMode(null); // Reset after success
            } else if (scanMode === 'emergency') {
                // For emergency, we assume checking if student is safe without full details
                // Or we can navigate to emergency screen?
                // Request said "scan for emergency". Let's assume register safe/missing toggle.
                // But toggleScanStatus requires STUDENT ID. data is usually student ID.

                // Let's ask confirmation
                Alert.alert(
                    'Confirmar Acción',
                    `¿Marcar estudiante (ID: ${data}) para emergencia?`,
                    [
                        { text: 'Cancelar', onPress: () => setScanned(false) },
                        {
                            text: 'Proceder',
                            onPress: async () => {
                                try {
                                    await api.toggleScanStatus(data, user.id);
                                    Alert.alert('Éxito', 'Estado de emergencia actualizado.');
                                } catch (e) {
                                    Alert.alert('Error', 'No se pudo actualizar el estado.');
                                } finally {
                                    setScanned(false);
                                }
                            }
                        }
                    ]
                );
            }
        } catch (e) {
            Alert.alert('Error', e.message || 'No se pudo procesar el código.');
            setScanned(false);
        }
    };

    if (scanMode === null) {
        return (
            <View style={[styles.container, { padding: SPACING.l, justifyContent: 'center' }]}>
                <Text style={styles.menuTitle}>Seleccione Modo de Escaneo</Text>

                <TouchableOpacity
                    style={[styles.menuButton, { backgroundColor: COLORS.primary }]}
                    onPress={() => setScanMode('medical')}
                >
                    <MaterialCommunityIcons name="medical-bag" size={40} color="white" />
                    <Text style={styles.menuButtonText}>Consulta Médica</Text>
                    <Text style={styles.menuButtonSub}>Ver expediente de salud</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuButton, { backgroundColor: COLORS.danger, marginTop: SPACING.l }]}
                    onPress={() => setScanMode('emergency')}
                >
                    <MaterialCommunityIcons name="alert-circle" size={40} color="white" />
                    <Text style={styles.menuButtonText}>Emergencia</Text>
                    <Text style={styles.menuButtonSub}>Gestión de seguridad</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />

            <ScannerOverlay />

            <View style={styles.controls}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'transparent']}
                    style={[styles.topBar, { paddingTop: insets.top + 20 }]}
                >
                    <View style={[styles.headerBanner, { backgroundColor: scanMode === 'emergency' ? COLORS.danger : COLORS.primary }]}>
                        <MaterialCommunityIcons
                            name={scanMode === 'emergency' ? "alert-circle" : "medical-bag"}
                            size={24}
                            color="white"
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.headerText}>
                            {scanMode === 'emergency' ? 'MODO EMERGENCIA' : 'CONSULTA MÉDICA'}
                        </Text>
                    </View>
                </LinearGradient>

                <TouchableOpacity style={styles.backButton} onPress={() => setScanMode(null)}>
                    <Text style={styles.backButtonText}>Cancelar / Volver</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    permissionText: {
        color: COLORS.text,
        fontSize: 18,
        marginVertical: SPACING.l,
        textAlign: 'center',
    },
    permissionButton: {
        borderRadius: LAYOUT.radius.l,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.m,
    },
    permissionButtonText: {
        color: COLORS.white,
        ...FONTS.bold,
        textAlign: 'center',
    },
    controls: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        zIndex: 10,
    },
    topBar: {
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: SPACING.l,
        alignItems: 'center',
    },
    headerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        borderRadius: LAYOUT.radius.l,
        marginBottom: SPACING.m,
        width: '100%',
        backgroundColor: COLORS.primary,
        ...SHADOWS.medium,
    },
    headerText: {
        color: 'white',
        ...FONTS.bold,
        fontSize: 18,
        letterSpacing: 1,
    },
    infoBox: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        width: '100%',
    },
    infoTitle: {
        color: 'white',
        fontSize: 16,
        ...FONTS.bold,
        marginBottom: 4,
    },
    infoSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
    },
    rescanButton: {
        alignSelf: 'center',
        marginBottom: 60,
        borderRadius: LAYOUT.radius.xl,
        overflow: 'hidden',
        backgroundColor: COLORS.primary,
        ...SHADOWS.medium,
    },
    rescanContainer: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.m,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rescanText: {
        color: 'white',
        fontSize: 16,
        ...FONTS.bold,
    },

    // Menu Styles
    menuTitle: {
        fontSize: 24,
        color: COLORS.text,
        ...FONTS.bold,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    menuButton: {
        padding: SPACING.l,
        borderRadius: LAYOUT.radius.l,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    menuButtonText: {
        fontSize: 20,
        color: 'white',
        ...FONTS.bold,
        marginTop: SPACING.s,
    },
    menuButtonSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    backButton: {
        alignSelf: 'center',
        marginBottom: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    backButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
