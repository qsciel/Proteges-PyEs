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
    const { user } = useContext(AuthContext);
    const insets = useSafeAreaInsets();

    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <MaterialCommunityIcons name="camera-off" size={64} color={COLORS.textSecondary} />
                <Text style={styles.permissionText}>Camera permission is required</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned) return;
        setScanned(true);

        const isQR = type === 'qr' || type === 256 || type === 'org.iso.QRCode';

        // Only accept QR codes - REJECT barcodes
        if (!isQR) {
            Alert.alert(
                'Wrong Scanner',
                'This scanner is for QR codes only. Please use the Barcode Scanner to register students as safe.',
                [{ text: 'OK', onPress: () => setScanned(false) }]
            );
            return;
        }

        // It's a QR code - navigate to student detail
        try {
            const student = await api.getStudent(data);
            navigation.navigate('StudentDetail', { student });
            setScanned(false);
        } catch (e) {
            console.log("Scan Error:", e);
            Alert.alert('Error', e.message || 'Student not found', [
                { text: 'OK', onPress: () => setScanned(false) }
            ]);
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />

            <ScannerOverlay />

            <View style={styles.controls}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'transparent']}
                    style={[styles.topBar, { paddingTop: insets.top + 20 }]}
                >
                    <View style={styles.headerBanner}>
                        <MaterialCommunityIcons name="medical-bag" size={24} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.headerText}>MEDICAL CONSULT</Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>Medical Information</Text>
                        <Text style={styles.infoSubtitle}>Scan student ID to view medical records</Text>
                    </View>
                </LinearGradient>

                {scanned && (
                    <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
                        <View style={styles.rescanContainer}>
                            <MaterialCommunityIcons name="camera-retake" size={24} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.rescanText}>Tap to Scan Again</Text>
                        </View>
                    </TouchableOpacity>
                )}
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
});
