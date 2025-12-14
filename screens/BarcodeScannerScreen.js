import React, { useState, useContext, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, LAYOUT, GRADIENTS, SHADOWS } from '../theme';
import ScannerOverlay from '../components/ScannerOverlay';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BarcodeScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanCount, setScanCount] = useState(0);
    const [scanResult, setScanResult] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { user } = useContext(AuthContext);
    const insets = useSafeAreaInsets();

    useFocusEffect(
        React.useCallback(() => {
            setScanCount(0);
            setScanned(false);
            return () => setScanned(false);
        }, [])
    );

    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <MaterialCommunityIcons name="camera-off" size={64} color={COLORS.textSecondary} />
                <Text style={styles.permissionText}>Se requiere permiso de cámara</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <LinearGradient colors={[COLORS.success, '#059669']} style={styles.gradientButton}>
                        <Text style={styles.permissionButtonText}>Otorgar Permiso</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    const showFeedback = (type, message) => {
        setScanResult({ type, message });
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(1200),
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true })
        ]).start(() => {
            setScanResult(null);
            setScanned(false);
        });
    };

    const handleBarCodeScanned = async ({ type, data }) => {
        console.log("📷 Code scanned:", type, data);
        if (scanned) return;
        setScanned(true);

        try {
            await api.registerScan(data, user.id, type);
            setScanCount(prev => prev + 1);
            showFeedback('success', `✓ Estudiante ${data} registrado`);
        } catch (e) {
            console.error("Scan Error:", e);
            // Check for specific duplicate error
            if (e.message?.includes('already marked') || e.status === 409) {
                showFeedback('warning', `⚠️ Estudiante ${data} ya registrado`);
            } else {
                showFeedback('error', e.message || 'Escaneo falló');
            }
        }
    };

    const getFeedbackColors = () => {
        if (scanResult.type === 'success') return [COLORS.success, '#059669'];
        if (scanResult.type === 'warning') return [COLORS.warning, '#F59E0B'];
        return GRADIENTS.danger;
    };

    const getFeedbackIcon = () => {
        if (scanResult.type === 'success') return 'check-circle';
        if (scanResult.type === 'warning') return 'information';
        return 'alert-circle';
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "codabar", "upc_e", "upc_a"],
                }}
                facing="back"
            />

            <ScannerOverlay />

            {scanResult && (
                <Animated.View style={[styles.feedbackOverlay, { opacity: fadeAnim }]}>
                    <LinearGradient
                        colors={getFeedbackColors()}
                        style={styles.feedbackGradient}
                    >
                        <MaterialCommunityIcons
                            name={getFeedbackIcon()}
                            size={48}
                            color="white"
                        />
                        <Text style={styles.feedbackText}>{scanResult.message}</Text>
                    </LinearGradient>
                </Animated.View>
            )}

            <View style={styles.controls}>
                <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
                    <LinearGradient
                        colors={[COLORS.success, '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.headerBanner}
                    >
                        <MaterialCommunityIcons name="shield-check" size={24} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.headerText}>PROTOCOLO DE EMERGENCIA</Text>
                    </LinearGradient>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>Registrar Estudiantes Seguros</Text>
                        <Text style={styles.infoSubtitle}>Escanee ID para marcar estudiante como SEGURO</Text>
                    </View>

                    <View style={styles.counterContainer}>
                        <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} style={{ marginRight: 8 }} />
                        <Text style={styles.counterText}>Escaneados: {scanCount} estudiantes</Text>
                    </View>
                </LinearGradient>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    permissionContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    permissionText: { color: COLORS.text, fontSize: 18, marginVertical: SPACING.l, textAlign: 'center' },
    permissionButton: { borderRadius: LAYOUT.radius.l, overflow: 'hidden' },
    gradientButton: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.m },
    permissionButtonText: { color: COLORS.white, ...FONTS.bold },
    controls: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 10 },
    topBar: { paddingTop: 20, paddingBottom: 40, paddingHorizontal: SPACING.l, alignItems: 'center' },
    headerBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.l, paddingVertical: SPACING.m, borderRadius: LAYOUT.radius.l, marginBottom: SPACING.m, width: '100%', ...SHADOWS.medium },
    headerText: { color: 'white', ...FONTS.bold, fontSize: 18, letterSpacing: 1 },
    infoBox: { backgroundColor: 'rgba(30, 41, 59, 0.9)', paddingHorizontal: SPACING.l, paddingVertical: SPACING.m, borderRadius: LAYOUT.radius.m, marginBottom: SPACING.m, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', width: '100%' },
    infoTitle: { color: 'white', fontSize: 16, ...FONTS.bold, marginBottom: 4 },
    infoSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    counterContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: SPACING.l, paddingVertical: SPACING.s, borderRadius: LAYOUT.radius.l, borderWidth: 1, borderColor: COLORS.success },
    counterText: { color: 'white', fontSize: 14, ...FONTS.bold },
    feedbackOverlay: { position: 'absolute', top: '40%', alignSelf: 'center', zIndex: 20, borderRadius: LAYOUT.radius.l, overflow: 'hidden', ...SHADOWS.large },
    feedbackGradient: { padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', minWidth: 220 },
    feedbackText: { color: 'white', fontSize: 18, textAlign: 'center', ...FONTS.bold, marginTop: 8 },
});
