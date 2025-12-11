import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, RefreshControl, FlatList, Alert, StatusBar, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import Button from '../components/PremiumButton';
import { COLORS, SPACING, FONTS, SHADOWS, LAYOUT } from '../theme';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function EmergencyScreen({ navigation }) {
    const [groups, setGroups] = useState([]);
    const [rawStudents, setRawStudents] = useState([]); // For report
    const [refreshing, setRefreshing] = useState(false);
    const [emergencyActive, setEmergencyActive] = useState(false);
    const { user } = useContext(AuthContext);

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
                const total = studentsData.length;
                const safe = studentsData.filter(s => s.scan_color).length;
                const missing = total - safe;

                setTotalCount(total);
                setSafeCount(safe);
                setMissingCount(missing);

                // Group Data for Performance
                const grouped = {};
                studentsData.forEach(student => {
                    const groupName = student.student?.grupo || student.grupo || 'Unassigned';
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
                    if (student.scan_color) grouped[groupName].safe++;
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
                "End Emergency",
                "Do you want to generate a report before closing?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "End & No Report", style: 'destructive', onPress: () => confirmEndEmergency() },
                    { text: "End & Generate PDF", onPress: () => { generateReport(); confirmEndEmergency(); } }
                ]
            );
        } else {
            Alert.alert("Confirm", "Are you sure you want to TRIGGER the emergency protocol?", [
                { text: "Cancel", style: "cancel" },
                { text: "TRIGGER", style: 'destructive', onPress: confirmTriggerEmergency }
            ]);
        }
    };

    const confirmTriggerEmergency = async () => {
        try {
            await api.triggerEmergency(true, user.id);
            setEmergencyActive(true);
            fetchData();
        } catch (e) { Alert.alert('Error', 'Failed to start emergency'); }
    }

    const confirmEndEmergency = async () => {
        try {
            await api.triggerEmergency(false, user.id);
            setEmergencyActive(false);
            setGroups([]);
        } catch (e) { Alert.alert('Error', 'Failed to end emergency'); }
    }

    const toggleStudentStatus = async (student) => {
        if (!emergencyActive) return;
        if (user.role !== 'Admin' && user.role !== 'Operator' && user.role !== 'SuperUser' && user.role !== 'Teacher') return;

        Alert.alert(
            "Update Status",
            `Mark ${student.student.nombre} as ${student.scan_color ? 'MISSING' : 'SAFE'}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        try {
                            await api.toggleScanStatus(student.student.id, user.id);
                            fetchData();
                            // Update local modal data slightly delayed or trigger refetch
                            // For complex state sync, simple refetch is robust
                            setTimeout(() => {
                                // We need to update the modal view too if open
                                // This is tricky without complex state management.
                                // simpler: close modal or better: find student in new data
                            }, 500);
                        } catch (e) { Alert.alert('Error', 'Failed to update status'); }
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

    const generateReport = async () => {
        try {
            const htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: Helvetica, sans-serif; padding: 20px; }
                        h1 { color: ${COLORS.danger}; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .safe { color: green; font-weight: bold; }
                        .missing { color: red; font-weight: bold; }
                        .summary { margin-top: 20px; font-size: 18px; }
                    </style>
                </head>
                <body>
                    <h1>Emergency Report</h1>
                    <p>Date: ${new Date().toLocaleString()}</p>
                    <p>Generated by: ${user.username}</p>
                    
                    <div class="summary">
                        <p>Total Students: ${totalCount}</p>
                        <p class="safe">Safe: ${safeCount}</p>
                        <p class="missing">Missing: ${missingCount}</p>
                    </div>

                    <table>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Group</th>
                            <th>Status</th>
                            <th>Time</th>
                        </tr>
                        ${rawStudents.map(s => `
                            <tr>
                                <td>${s.student.id}</td>
                                <td>${s.student.nombre} ${s.student.apellido_paterno}</td>
                                <td>${s.student.grupo || '-'}</td>
                                <td class="${s.scan_color ? 'safe' : 'missing'}">${s.scan_color ? 'SAFE' : 'MISSING'}</td>
                                <td>${s.scan_timestamp ? new Date(s.scan_timestamp).toLocaleTimeString() : '-'}</td>
                            </tr>
                        `).join('')}
                    </table>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('Report error:', error);
            Alert.alert('Error', 'Could not generate report');
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData().then(() => setRefreshing(false));
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const renderGroupItem = ({ item }) => (
        <TouchableOpacity style={styles.groupCard} onPress={() => openGroupModal(item)}>
            <View style={styles.groupHeader}>
                <View style={styles.groupIcon}>
                    <Text style={styles.groupIconText}>{item.name}</Text>
                </View>
                <View>
                    <Text style={styles.groupName}>Group {item.name}</Text>
                    <Text style={styles.groupSub}>{item.total} Students</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
            </View>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { flex: item.safe, backgroundColor: COLORS.success }]} />
                <View style={[styles.progressBar, { flex: item.missing, backgroundColor: COLORS.danger }]} />
            </View>
            <View style={styles.groupStats}>
                <Text style={{ color: COLORS.success, ...FONTS.bold }}>{item.safe} Safe</Text>
                <Text style={{ color: COLORS.danger, ...FONTS.bold }}>{item.missing} Missing</Text>
            </View>
        </TouchableOpacity>
    );

    const renderStudentItem = (student) => (
        <TouchableOpacity
            key={student.student.id}
            activeOpacity={0.7}
            onPress={() => toggleStudentStatus(student)}
            style={[styles.row, student.scan_color ? { borderLeftColor: student.scan_color, borderLeftWidth: 4 } : { borderLeftColor: COLORS.danger, borderLeftWidth: 4 }]}
        >
            <View style={styles.rowContent}>
                <View style={styles.studentInfo}>
                    <Text style={styles.name}>{student.student.nombre} {student.student.apellido_paterno}</Text>
                    <Text style={styles.details}>ID: {student.student.id}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    {student.scan_color ? (
                        <View>
                            <View style={[styles.badge, { backgroundColor: `${student.scan_color}15`, borderColor: student.scan_color }]}>
                                <MaterialCommunityIcons name="shield-check" size={16} color={student.scan_color} style={{ marginRight: 4 }} />
                                <Text style={[styles.badgeText, { color: student.scan_color }]}>SAFE</Text>
                            </View>
                            {student.scan_teacher_name && (
                                <Text style={[styles.teacherText, { color: student.scan_color }]}>{student.scan_teacher_name}</Text>
                            )}
                        </View>
                    ) : (
                        <View style={[styles.badge, { backgroundColor: COLORS.danger + '15', borderColor: COLORS.danger }]}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.danger} style={{ marginRight: 4 }} />
                            <Text style={[styles.badgeText, { color: COLORS.danger }]}>MISSING</Text>
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
                    <Text style={[styles.counterLabel, { color: COLORS.success }]}>SAFE</Text>
                    <Text style={[styles.counterValue, { color: COLORS.success }]}>{safeCount}</Text>
                </View>
                <View style={[styles.counterBox, { backgroundColor: COLORS.danger + '10', borderColor: COLORS.danger }]}>
                    <Text style={[styles.counterLabel, { color: COLORS.danger }]}>MISSING</Text>
                    <Text style={[styles.counterValue, { color: COLORS.danger }]}>{missingCount}</Text>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper>
            <StatusBar barStyle="light-content" backgroundColor={emergencyActive ? COLORS.danger : COLORS.primary} />
            <View style={[styles.header, { backgroundColor: emergencyActive ? COLORS.danger : COLORS.primary }]}>
                <Text style={styles.headerTitle}>Emergency Monitor</Text>

                {emergencyActive && (
                    <TouchableOpacity
                        style={styles.historyBtn}
                        onPress={() => setHistoryModalVisible(true)}
                    >
                        <MaterialCommunityIcons name="history" size={24} color={COLORS.white} />
                        <Text style={styles.historyBtnText}>History</Text>
                    </TouchableOpacity>
                )}

                <View style={[styles.statusContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <MaterialCommunityIcons name={emergencyActive ? "alert-octagon" : "shield-check"} size={24} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.headerSubtitle}>{emergencyActive ? 'EMERGENCY ACTIVE' : 'SYSTEM NORMAL'}</Text>
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
                    <Text style={styles.safeStateText}>No active emergency.</Text>
                    <Text style={styles.safeStateSubText}>Students are safe. Trigger only in case of real emergency or drill.</Text>
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
                            <Text style={styles.modalTitle}>Scan History</Text>
                            <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Recent actions</Text>

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
                                            {item.action === 'REVOKED' ? ' marked missing' : ' marked safe'}
                                        </Text>
                                        <Text style={styles.historySubText}>by {item.user_name} • {new Date(item.timestamp).toLocaleTimeString()}</Text>
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
                            <Text style={styles.modalTitle}>Group {selectedGroup?.name}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>{selectedGroup?.safe} Safe • {selectedGroup?.missing} Missing</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedGroupStudents.map(student => renderStudentItem(student))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {(user?.role === 'Admin' || user?.role === 'Operator' || user?.role === 'SuperUser') && (
                <View style={styles.bottomControls}>
                    <Button
                        title={emergencyActive ? "END EMERGENCY" : "TRIGGER EMERGENCY"}
                        onPress={toggleEmergency}
                        variant={emergencyActive ? 'secondary' : 'danger'}
                        style={styles.actionButton}
                    />
                </View>
            )}
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

    fab: { position: 'absolute', bottom: 100, right: 20, ...SHADOWS.large },
    fabCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },

    safeStateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, marginTop: 50 },
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
