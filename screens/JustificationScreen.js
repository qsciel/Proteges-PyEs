import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONTS, LAYOUT, SHADOWS } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

export default function JustificationScreen({ route, navigation }) {
    const { studentId, studentName } = route.params || {};

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });

            if (!result.canceled) {
                setImage(result.assets[0]);
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo abrir la cámara');
        }
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Error', 'Debe especificar el motivo');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('student_id', studentId);
            formData.append('date', date);
            formData.append('reason', reason);

            if (image) {
                // Infer type from extension
                const filename = image.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('evidence', {
                    uri: image.uri,
                    name: filename,
                    type,
                });
            }

            await api.submitJustification(formData);
            Alert.alert('Éxito', 'Justificante enviado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo enviar el justificante');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Solicitar Justificante</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.studentLabel}>Estudiante: <Text style={{ ...FONTS.bold }}>{studentName}</Text></Text>

                <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
                <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setDate}
                    placeholder="2024-01-01"
                />

                <Text style={styles.label}>Motivo</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Describa la razón de la falta..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                <Text style={styles.label}>Evidencia (Foto/Receta)</Text>
                <View style={styles.imageButtons}>
                    <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                        <MaterialCommunityIcons name="image" size={24} color={COLORS.primary} />
                        <Text style={styles.imageBtnText}>Galería</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imageBtn} onPress={takePhoto}>
                        <MaterialCommunityIcons name="camera" size={24} color={COLORS.primary} />
                        <Text style={styles.imageBtnText}>Cámara</Text>
                    </TouchableOpacity>
                </View>

                {image && (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: image.uri }} style={styles.preview} />
                        <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(null)}>
                            <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.danger} />
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.submitButton, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitText}>Enviar Solicitud</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: COLORS.primary,
        padding: SPACING.l,
        paddingTop: SPACING.xl,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: SPACING.m,
    },
    title: {
        fontSize: 20,
        ...FONTS.bold,
        color: COLORS.white,
    },
    content: {
        padding: SPACING.l,
    },
    studentLabel: {
        fontSize: 16,
        color: COLORS.text,
        marginBottom: SPACING.l,
    },
    label: {
        fontSize: 14,
        ...FONTS.semiBold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.s,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        marginBottom: SPACING.l,
        fontSize: 16,
    },
    textArea: {
        height: 100,
    },
    imageButtons: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginBottom: SPACING.m,
    },
    imageBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.primary,
        gap: SPACING.s,
    },
    imageBtnText: {
        color: COLORS.primary,
        ...FONTS.medium,
    },
    previewContainer: {
        position: 'relative',
        marginBottom: SPACING.l,
        alignItems: 'center',
    },
    preview: {
        width: '100%',
        height: 200,
        borderRadius: LAYOUT.radius.m,
        resizeMode: 'cover',
    },
    removeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 12,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.l,
        borderRadius: LAYOUT.radius.m,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    submitText: {
        color: COLORS.white,
        fontSize: 18,
        ...FONTS.bold,
    },
});
