import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONTS, LAYOUT, SHADOWS } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminJustificationScreen({ navigation }) {
    const [justifications, setJustifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [comment, setComment] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadJustifications();
    }, []);

    const loadJustifications = async () => {
        setLoading(true);
        try {
            const data = await api.getPendingJustifications();
            setJustifications(data || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudieron cargar los justificantes');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedItem) return;
        setProcessing(true);
        try {
            await api.updateJustificationStatus(selectedItem.id, status, comment);
            Alert.alert('Éxito', `Justificante ${status === 'APROBADO' ? 'aprobado' : 'rechazado'} correctamente`);
            setModalVisible(false);
            setSelectedItem(null);
            setComment('');
            loadJustifications();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo actualizar el estado');
        } finally {
            setProcessing(false);
        }
    };

    const openModal = (item) => {
        setSelectedItem(item);
        setComment('');
        setModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
            <View style={styles.cardHeader}>
                <Text style={styles.studentId}>{item.estudiante_id}</Text>
                <Text style={styles.date}>{item.fecha_justificacion}</Text>
            </View>
            <Text style={styles.reason} numberOfLines={2}>{item.motivo}</Text>
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.estado}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Revisión de Justificantes</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
            ) : (
                <FlatList
                    data={justifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No hay justificantes pendientes</Text>
                    }
                />
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalle Justificante</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedItem && (
                            <View>
                                <Text style={styles.detailLabel}>Estudiante: {selectedItem.estudiante_id}</Text>
                                <Text style={styles.detailLabel}>Fecha Falta: {selectedItem.fecha_justificacion}</Text>
                                <Text style={styles.detailLabel}>Motivo:</Text>
                                <Text style={styles.detailText}>{selectedItem.motivo}</Text>

                                {selectedItem.evidencia_url && (
                                    <View>
                                        <Text style={styles.detailLabel}>Evidencia:</Text>
                                        <Image
                                            source={{ uri: api.getEvidenceUrl(selectedItem.evidencia_url) }}
                                            style={styles.evidenceImage}
                                        />
                                    </View>
                                )}

                                <Text style={styles.detailLabel}>Comentario Admin (Opcional):</Text>
                                <TextInput
                                    style={styles.commentInput}
                                    value={comment}
                                    onChangeText={setComment}
                                    placeholder="Motivo de rechazo o nota..."
                                />

                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.rejectBtn]}
                                        onPress={() => handleUpdateStatus('RECHAZADO')}
                                        disabled={processing}
                                    >
                                        <Text style={styles.btnText}>Rechazar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.approveBtn]}
                                        onPress={() => handleUpdateStatus('APROBADO')}
                                        disabled={processing}
                                    >
                                        <Text style={styles.btnText}>Aprobar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
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
    listContent: {
        padding: SPACING.m,
    },
    card: {
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        marginBottom: SPACING.m,
        ...SHADOWS.small,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.s,
    },
    studentId: {
        ...FONTS.bold,
        color: COLORS.text,
    },
    date: {
        color: COLORS.textSecondary,
    },
    reason: {
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    statusBadge: {
        backgroundColor: COLORS.warning,
        paddingHorizontal: SPACING.s,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: COLORS.white,
        fontSize: 10,
        ...FONTS.bold,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: SPACING.xl,
        color: COLORS.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: LAYOUT.radius.l,
        borderTopRightRadius: LAYOUT.radius.l,
        padding: SPACING.l,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.l,
    },
    modalTitle: {
        fontSize: 18,
        ...FONTS.bold,
    },
    detailLabel: {
        ...FONTS.semiBold,
        marginTop: SPACING.m,
    },
    detailText: {
        color: COLORS.text,
        marginTop: 2,
    },
    evidenceImage: {
        width: '100%',
        height: 200,
        borderRadius: LAYOUT.radius.m,
        resizeMode: 'contain',
        marginVertical: SPACING.s,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: LAYOUT.radius.s,
        padding: SPACING.s,
        marginTop: SPACING.s,
        marginBottom: SPACING.l,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginTop: SPACING.m,
        marginBottom: SPACING.xl,
    },
    actionBtn: {
        flex: 1,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.s,
        alignItems: 'center',
    },
    approveBtn: {
        backgroundColor: COLORS.success,
    },
    rejectBtn: {
        backgroundColor: COLORS.danger,
    },
    btnText: {
        color: COLORS.white,
        ...FONTS.bold,
    },
});
