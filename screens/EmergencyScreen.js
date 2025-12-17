import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl, FlatList, Alert, StatusBar, TouchableOpacity, Modal, ScrollView, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import Button from '../components/PremiumButton';
import { COLORS, SPACING, FONTS, SHADOWS, LAYOUT } from '../theme';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } from 'docx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function EmergencyScreen({ navigation }) {
    const [groups, setGroups] = useState([]);
    const [rawStudents, setRawStudents] = useState([]); // For report
    const [refreshing, setRefreshing] = useState(false);
    const [emergencyActive, setEmergencyActive] = useState(false);
    const { user } = useAuth();

    // Counters
    const [safeCount, setSafeCount] = useState(0);
    const [missingCount, setMissingCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // Group Details Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedGroupStudents, setSelectedGroupStudents] = useState([]);

    // History Modal
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [historyData, setHistoryData] = useState([]);

    // Report Options Modal
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [reportOptions, setReportOptions] = useState({
        includeContactInfo: true,
        includeMedicalInfo: false,
        groupBy: 'missing', // 'all', 'missing', 'safe'
    });

    const fetchData = async () => {
        try {
            const statusData = await api.getEmergencyStatus();
            setEmergencyActive(statusData.active);

            if (statusData.active) {
                const studentsData = await api.getEmergencyStudents();
                setRawStudents(studentsData);

                // Fetch history if modal is open to keep it live
                if (historyModalVisible) {
                    const history = await api.getEmergencyHistory();
                    setHistoryData(history);
                }

                // Calculate stats
                // Calculate stats
                const total = studentsData.length;
                const safe = studentsData.filter(s => s.scanned).length; // scanned instead of scan_color check if bool
                const missing = total - safe;

                setTotalCount(total);
                setSafeCount(safe);
                setMissingCount(missing);

                // Group Data for Performance
                const grouped = {};
                studentsData.forEach(student => {
                    const groupName = student.group || 'Unassigned';
                    if (!grouped[groupName]) {
                        grouped[groupName] = {
                            name: groupName,
                            total: 0,
                            safe: 0,
                            missing: 0,
                            students: []
                        };
                    }
                    grouped[groupName].students.push(student);
                    grouped[groupName].total++;
                    if (student.scanned) grouped[groupName].safe++;
                    else grouped[groupName].missing++;
                });

                setGroups(Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)));

            } else {
                // If inactive, clear data
                setGroups([]);
                setRawStudents([]);
                setSafeCount(0);
                setMissingCount(0);
                setTotalCount(0);
            }
        } catch (e) {
            console.error("Emergency Fetch Error:", e);
        }
    };

    const toggleEmergency = async () => {
        if (emergencyActive) {
            Alert.alert(
                "Finalizar Emergencia",
                "¿Desea generar un reporte antes de finalizar?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Finalizar sin Reporte", style: 'destructive', onPress: () => confirmEndEmergency() },
                    { text: "Finalizar y Generar Reporte", onPress: () => { setShowReportOptions(true); } }
                ]
            );
        } else {
            Alert.alert("Confirmar", "¿Está seguro de que desea ACTIVAR el protocolo de emergencia?", [
                { text: "Cancelar", style: "cancel" },
                { text: "ACTIVAR", style: 'destructive', onPress: confirmTriggerEmergency }
            ]);
        }
    };

    const confirmTriggerEmergency = async () => {
        try {
            await api.triggerEmergency(true, user.id);
            setEmergencyActive(true);
            fetchData();
        } catch (e) { Alert.alert('Error', 'Fallo al iniciar emergencia'); }
    }

    const confirmEndEmergency = async () => {
        try {
            await api.triggerEmergency(false, user.id);
            setEmergencyActive(false);
            setGroups([]);
        } catch (e) { Alert.alert('Error', 'Fallo al finalizar emergencia'); }
    }

    const toggleStudentStatus = async (student) => {
        if (!emergencyActive) return;
        const validRoles = ['Docente', 'Prefecto', 'Doctor', 'Director', 'Operador'];
        if (!validRoles.includes(user?.role)) return;

        Alert.alert(
            "Actualizar Estado",
            `¿Marcar a ${student.names} como ${student.scanned ? 'FALTANTE' : 'SEGURO'}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Confirmar",
                    onPress: async () => {
                        try {
                            await api.toggleScanStatus(student.id, user.id);
                            fetchData();
                            // Update local modal data slightly delayed or trigger refetch
                            // For complex state sync, simple refetch is robust
                            setTimeout(() => {
                                // We need to update the modal view too if open
                                // This is tricky without complex state management.
                                // simpler: close modal or better: find student in new data
                            }, 500);
                        } catch (e) { Alert.alert('Error', 'Fallo al actualizar estado'); }
                    }
                }
            ]
        );
    }

    const openGroupModal = (group) => {
        setSelectedGroup(group);
        setSelectedGroupStudents(group.students);
        setModalVisible(true);
    };

    // Update modal data when global data changes
    useEffect(() => {
        if (modalVisible && selectedGroup) {
            const currentGroup = groups.find(g => g.name === selectedGroup.name);
            if (currentGroup) {
                setSelectedGroup(currentGroup);
                setSelectedGroupStudents(currentGroup.students);
            }
        }
    }, [groups]);

    useEffect(() => {
        if (historyModalVisible) {
            api.getEmergencyHistory().then(setHistoryData).catch(console.error);
        }
    }, [historyModalVisible]);

    const openHistoryModal = () => {
        setHistoryModalVisible(true);
    };

    const generateWordReport = async () => {
        if (!rawStudents || rawStudents.length === 0) {
            Alert.alert('Sin datos', 'No hay estudiantes para generar reporte.');
            return;
        }

        setShowReportOptions(false);

        const missingStudents = rawStudents.filter(s => !s.scanned);
        const safeStudents = rawStudents.filter(s => s.scanned);

        // Filter based on groupBy option
        let studentsToShow = [];
        if (reportOptions.groupBy === 'all') {
            studentsToShow = rawStudents;
        } else if (reportOptions.groupBy === 'missing') {
            studentsToShow = missingStudents;
        } else {
            studentsToShow = safeStudents;
        }

        try {
            // Create Word document
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        // Title
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "REPORTE DE EMERGENCIA",
                                    bold: true,
                                    size: 32,
                                    color: "DC2626",
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 },
                        }),

                        // Date and Summary
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Fecha y Hora: ${new Date().toLocaleString('es-ES')}`,
                                    size: 24,
                                }),
                            ],
                            spacing: { after: 200 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Total de Estudiantes: ${rawStudents.length}`,
                                    size: 24,
                                }),
                            ],
                            spacing: { after: 100 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Estudiantes Seguros: ${safeStudents.length}`,
                                    size: 24,
                                    color: "059669",
                                }),
                            ],
                            spacing: { after: 100 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Estudiantes Faltantes: ${missingStudents.length}`,
                                    size: 24,
                                    color: "DC2626",
                                }),
                            ],
                            spacing: { after: 400 },
                        }),

                        // Section Title
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: reportOptions.groupBy === 'all' ? 'TODOS LOS ESTUDIANTES' :
                                        reportOptions.groupBy === 'missing' ? 'ESTUDIANTES FALTANTES' :
                                            'ESTUDIANTES SEGUROS',
                                    bold: true,
                                    size: 28,
                                    color: reportOptions.groupBy === 'safe' ? "059669" : "DC2626",
                                }),
                            ],
                            spacing: { after: 200 },
                        }),

                        // Table
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                // Header row
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [new Paragraph({ text: "ID", alignment: AlignmentType.CENTER })],
                                            shading: { fill: "316C59" },
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ text: "Nombre Completo", alignment: AlignmentType.CENTER })],
                                            shading: { fill: "316C59" },
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ text: "Grupo", alignment: AlignmentType.CENTER })],
                                            shading: { fill: "316C59" },
                                        }),
                                        new TableCell({
                                            children: [new Paragraph({ text: "Especialidad", alignment: AlignmentType.CENTER })],
                                            shading: { fill: "316C59" },
                                        }),
                                        ...(reportOptions.includeContactInfo ? [
                                            new TableCell({
                                                children: [new Paragraph({ text: "Contacto", alignment: AlignmentType.CENTER })],
                                                shading: { fill: "316C59" },
                                            }),
                                        ] : []),
                                    ],
                                }),
                                // Data rows
                                ...studentsToShow.map(s => new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph(s.id)] }),
                                        new TableCell({ children: [new Paragraph(`${s.names} ${s.paternal_last_name} ${s.maternal_last_name || ''}`)] }),
                                        new TableCell({ children: [new Paragraph(s.group)] }),
                                        new TableCell({ children: [new Paragraph(s.major || 'N/A')] }),
                                        ...(reportOptions.includeContactInfo ? [
                                            new TableCell({ children: [new Paragraph("Ver sistema")] }),
                                        ] : []),
                                    ],
                                })),
                            ],
                        }),

                        // Notes section
                        new Paragraph({
                            text: "",
                            spacing: { before: 400, after: 200 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "NOTAS Y OBSERVACIONES:",
                                    bold: true,
                                    size: 24,
                                }),
                            ],
                            spacing: { after: 200 },
                        }),
                        new Paragraph({ text: "_".repeat(100), spacing: { after: 100 } }),
                        new Paragraph({ text: "_".repeat(100), spacing: { after: 100 } }),
                        new Paragraph({ text: "_".repeat(100), spacing: { after: 100 } }),
                        new Paragraph({ text: "_".repeat(100), spacing: { after: 100 } }),
                    ],
                }],
            });

            // Convert to base64 string directly
            const base64 = await Packer.toBase64String(doc);
            const fileName = `Reporte_Emergencia_${new Date().toISOString().split('T')[0]}.docx`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding: 'base64',
            });

            // Share file
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    dialogTitle: 'Compartir Reporte de Emergencia',
                });
            }

            Alert.alert('Éxito', 'Reporte Word generado y listo para editar');
        } catch (error) {
            console.error('Error generating Word report:', error);
            Alert.alert('Error', 'No se pudo generar el reporte Word');
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData().then(() => setRefreshing(false));
    }, []);

    useEffect(() => {
        fetchData();
        // ✅ OPTIMIZACIÓN: Reducido de 3s a 10s para ahorrar batería y red
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const renderGroupItem = ({ item }) => (
        <TouchableOpacity style={styles.groupCard} onPress={() => openGroupModal(item)}>
            <View style={styles.groupHeader}>
                <View style={styles.groupIcon}>
                    <Text style={styles.groupIconText}>{item.name}</Text>
                </View>
                <View>
                    <Text style={styles.groupName}>Grupo {item.name}</Text>
                    <Text style={styles.groupSub}>{item.total} Estudiantes</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
            </View>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { flex: item.safe, backgroundColor: COLORS.success }]} />
                <View style={[styles.progressBar, { flex: item.missing, backgroundColor: COLORS.danger }]} />
            </View>
            <View style={styles.groupStats}>
                <Text style={{ color: COLORS.success, ...FONTS.bold }}>{item.safe} Seguros</Text>
                <Text style={{ color: COLORS.danger, ...FONTS.bold }}>{item.missing} Faltantes</Text>
            </View>
        </TouchableOpacity>
    );

    const renderStudentItem = (student) => (
        <TouchableOpacity
            key={student.id}
            activeOpacity={0.7}
            onPress={() => toggleStudentStatus(student)}
            style={[styles.row, student.scanned ? { borderLeftColor: student.teacher_color || COLORS.success, borderLeftWidth: 4 } : { borderLeftColor: COLORS.danger, borderLeftWidth: 4 }]}
        >
            <View style={styles.rowContent}>
                <View style={styles.studentInfo}>
                    <Text style={styles.name}>{student.names} {student.paternal_last_name}</Text>
                    <Text style={styles.details}>ID: {student.id}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    {student.scanned ? (
                        <View>
                            <View style={[styles.badge, { backgroundColor: `${student.teacher_color || COLORS.success}15`, borderColor: student.teacher_color || COLORS.success }]}>
                                <MaterialCommunityIcons name="shield-check" size={16} color={student.teacher_color || COLORS.success} style={{ marginRight: 4 }} />
                                <Text style={[styles.badgeText, { color: student.teacher_color || COLORS.success }]}>SEGURO</Text>
                            </View>
                            {/* Teacher name not available in current backend response - omit for now or add to backend */}
                        </View>
                    ) : (
                        <View style={[styles.badge, { backgroundColor: COLORS.danger + '15', borderColor: COLORS.danger }]}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.danger} style={{ marginRight: 4 }} />
                            <Text style={[styles.badgeText, { color: COLORS.danger }]}>FALTANTE</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCounters = () => {
        if (!emergencyActive) return null;
        return (
            <View style={styles.counterContainer}>
                <View style={[styles.counterBox, { backgroundColor: COLORS.success + '10', borderColor: COLORS.success }]}>
                    <Text style={[styles.counterLabel, { color: COLORS.success }]}>SEGUROS</Text>
                    <Text style={[styles.counterValue, { color: COLORS.success }]}>{safeCount}</Text>
                </View>
                <View style={[styles.counterBox, { backgroundColor: COLORS.danger + '10', borderColor: COLORS.danger }]}>
                    <Text style={[styles.counterLabel, { color: COLORS.danger }]}>FALTANTES</Text>
                    <Text style={[styles.counterValue, { color: COLORS.danger }]}>{missingCount}</Text>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper>
            <StatusBar barStyle="light-content" backgroundColor={emergencyActive ? COLORS.danger : COLORS.primary} />
            <View style={[styles.header, { backgroundColor: emergencyActive ? COLORS.danger : COLORS.primary }]}>
                <Text style={styles.headerTitle}>Monitor de Emergencia</Text>

                <TouchableOpacity
                    style={styles.historyBtn}
                    onPress={() => setHistoryModalVisible(true)}
                >
                    <MaterialCommunityIcons name="history" size={24} color={COLORS.white} />
                    <Text style={styles.historyBtnText}>Historial</Text>
                </TouchableOpacity>

                <View style={[styles.statusContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <MaterialCommunityIcons name={emergencyActive ? "alert-octagon" : "shield-check"} size={24} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.headerSubtitle}>{emergencyActive ? 'EMERGENCIA ACTIVA' : 'SISTEMA NORMAL'}</Text>
                </View>
            </View>



            {renderCounters()}

            {emergencyActive ? (
                <FlatList
                    data={groups}
                    renderItem={renderGroupItem}
                    keyExtractor={(item) => item.name}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.safeStateContainer}>
                    <DownloadIcon />
                    <Text style={styles.safeStateText}>No hay emergencia activa</Text>
                    <Text style={styles.safeStateSubText}>Los estudiantes están seguros. Active solo en caso de emergencia real o simulacro.</Text>
                </View>
            )}

            {emergencyActive && (
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('BarcodeScanner')} activeOpacity={0.8}>
                    <View style={[styles.fabCircle, { backgroundColor: COLORS.white }]}>
                        <MaterialCommunityIcons name="barcode-scan" size={28} color={COLORS.danger} />
                    </View>
                </TouchableOpacity>
            )}

            {/* History Modal */}
            <Modal visible={historyModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Historial de Escaneos</Text>
                            <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Acciones recientes</Text>

                        <FlatList
                            data={historyData}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.historyItem}>
                                    <View style={[styles.historyIcon, { backgroundColor: item.action === 'REVOKED' ? COLORS.danger + '20' : COLORS.success + '20' }]}>
                                        <MaterialCommunityIcons
                                            name={item.action === 'REVOKED' ? "alert-circle" : "check"}
                                            size={20}
                                            color={item.action === 'REVOKED' ? COLORS.danger : COLORS.success}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.historyText}>
                                            <Text style={{ fontWeight: 'bold' }}>{item.student_name}</Text>
                                            {item.action === 'REVOKED' ? ' marcado faltante' : ' marcado seguro'}
                                        </Text>
                                        <Text style={styles.historySubText}>por {item.user_name} • {new Date(item.timestamp).toLocaleTimeString()}</Text>
                                    </View>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Student List Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Grupo {selectedGroup?.name}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>{selectedGroup?.safe} Seguros • {selectedGroup?.missing} Faltantes</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedGroupStudents.map(student => renderStudentItem(student))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {['Director', 'Operador'].includes(user?.role) && (
                <View style={styles.bottomControls}>
                    <Button
                        title={emergencyActive ? "FINALIZAR EMERGENCIA" : "ACTIVAR EMERGENCIA"}
                        onPress={toggleEmergency}
                        variant={emergencyActive ? 'secondary' : 'danger'}
                        style={styles.actionButton}
                    />
                </View>
            )}

            {/* Report Options Modal */}
            <Modal
                visible={showReportOptions}
                transparent
                animationType="slide"
                onRequestClose={() => setShowReportOptions(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Personalizar Reporte</Text>
                        <Text style={styles.modalSubtitle}>Opciones para el reporte Word editable</Text>

                        <ScrollView>
                            <View style={{ paddingVertical: SPACING.m }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.m }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ ...FONTS.semiBold, marginBottom: 4 }}>Incluir Contactos</Text>
                                        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Teléfonos de emergencia</Text>
                                    </View>
                                    <Switch
                                        value={reportOptions.includeContactInfo}
                                        onValueChange={v => setReportOptions({ ...reportOptions, includeContactInfo: v })}
                                    />
                                </View>

                                <View style={{ marginTop: SPACING.l }}>
                                    <Text style={{ ...FONTS.semiBold, marginBottom: SPACING.m }}>Mostrar Estudiantes:</Text>

                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', padding: SPACING.s, marginBottom: SPACING.s }}
                                        onPress={() => setReportOptions({ ...reportOptions, groupBy: 'missing' })}
                                    >
                                        <MaterialCommunityIcons
                                            name={reportOptions.groupBy === 'missing' ? 'radiobox-marked' : 'radiobox-blank'}
                                            size={24}
                                            color={COLORS.primary}
                                        />
                                        <Text style={{ marginLeft: SPACING.s }}> Solo Faltantes ({missingCount})</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', padding: SPACING.s, marginBottom: SPACING.s }}
                                        onPress={() => setReportOptions({ ...reportOptions, groupBy: 'all' })}
                                    >
                                        <MaterialCommunityIcons
                                            name={reportOptions.groupBy === 'all' ? 'radiobox-marked' : 'radiobox-blank'}
                                            size={24}
                                            color={COLORS.primary}
                                        />
                                        <Text style={{ marginLeft: SPACING.s }}>Todos ({totalCount})</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', padding: SPACING.s }}
                                        onPress={() => setReportOptions({ ...reportOptions, groupBy: 'safe' })}
                                    >
                                        <MaterialCommunityIcons
                                            name={reportOptions.groupBy === 'safe' ? 'radiobox-marked' : 'radiobox-blank'}
                                            size={24}
                                            color={COLORS.primary}
                                        />
                                        <Text style={{ marginLeft: SPACING.s }}>Solo Seguros ({safeCount})</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={{ flexDirection: 'row', gap: SPACING.m, marginTop: SPACING.m }}>
                            <TouchableOpacity
                                style={{ flex: 1, padding: SPACING.m, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, borderRadius: 8, alignItems: 'center' }}
                                onPress={() => setShowReportOptions(false)}
                            >
                                <Text style={{ ...FONTS.semiBold }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, flexDirection: 'row', padding: SPACING.m, backgroundColor: COLORS.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                                onPress={() => {
                                    generateWordReport();
                                    confirmEndEmergency();
                                }}
                            >
                                <MaterialCommunityIcons name="file-word" size={20} color={COLORS.white} />
                                <Text style={{ ...FONTS.semiBold, color: COLORS.white, marginLeft: 8 }}>Generar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
}

const DownloadIcon = () => (
    <View style={{ marginBottom: 20, opacity: 0.5 }}>
        <MaterialCommunityIcons name="shield-check-outline" size={100} color={COLORS.textSecondary} />
    </View>
);

const styles = StyleSheet.create({
    header: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: SPACING.l, alignItems: 'center', marginBottom: SPACING.m, ...SHADOWS.medium },
    headerTitle: { fontSize: 28, color: COLORS.white, ...FONTS.h2, marginBottom: SPACING.m },
    statusContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.l, paddingVertical: SPACING.s, borderRadius: LAYOUT.radius.l, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    headerSubtitle: { fontSize: 16, color: COLORS.white, ...FONTS.bold, letterSpacing: 0.5 },
    adminControls: { paddingHorizontal: SPACING.l, marginBottom: SPACING.m, marginTop: -20 },
    bottomControls: {
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 20,
        ...SHADOWS.large
    },
    actionButton: { ...SHADOWS.medium },

    counterContainer: { flexDirection: 'row', paddingHorizontal: SPACING.l, gap: SPACING.m, marginBottom: SPACING.m },
    counterBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.m, borderRadius: LAYOUT.radius.m, borderWidth: 1 },
    counterLabel: { fontSize: 12, ...FONTS.bold, textTransform: 'uppercase', marginBottom: 4 },
    counterValue: { fontSize: 32, ...FONTS.bold },

    listContent: { paddingBottom: 150, paddingTop: SPACING.s, paddingHorizontal: SPACING.l },

    // Group Card Styles
    groupCard: { backgroundColor: COLORS.surface, borderRadius: LAYOUT.radius.m, padding: SPACING.m, marginBottom: SPACING.m, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
    groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m },
    groupIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceWithOpacity, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m },
    groupIconText: { ...FONTS.bold, color: COLORS.text, fontSize: 16 },
    groupName: { ...FONTS.bold, fontSize: 16, color: COLORS.text },
    groupSub: { color: COLORS.textSecondary, fontSize: 12 },
    progressContainer: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', marginBottom: 8 },
    progressBar: { height: '100%' },
    groupStats: { flexDirection: 'row', justifyContent: 'space-between' },

    // Student List Styles (reused)
    row: { backgroundColor: COLORS.surface, marginVertical: 4, padding: SPACING.m, borderRadius: LAYOUT.radius.m, borderLeftWidth: 0, borderWidth: 1, borderColor: COLORS.border },
    rowContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    studentInfo: { flex: 1 },
    name: { fontSize: 16, color: COLORS.text, ...FONTS.bold, marginBottom: 2 },
    details: { fontSize: 12, color: COLORS.textSecondary },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    badgeText: { fontSize: 10, ...FONTS.bold, letterSpacing: 0.5 },
    teacherText: { fontSize: 9, ...FONTS.medium, marginTop: 4, textAlign: 'right' },

    fab: { position: 'absolute', bottom: 180, right: 20, ...SHADOWS.large },
    fabCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },

    safeStateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
    safeStateText: { fontSize: 20, color: COLORS.text, ...FONTS.bold, marginBottom: SPACING.s },
    safeStateSubText: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: LAYOUT.radius.l, borderTopRightRadius: LAYOUT.radius.l, padding: SPACING.l, maxHeight: '80%', ...SHADOWS.large },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 24, color: COLORS.text, ...FONTS.bold },
    modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.l },

    historyBtn: { position: 'absolute', right: 20, top: 60, alignItems: 'center' },
    historyBtnText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    historyIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    historyText: { fontSize: 14, color: COLORS.text },
    historySubText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
