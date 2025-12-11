import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS, SPACING, FONTS, SHADOWS, LAYOUT } from '../theme';
import Card from '../components/Card';
import Button from '../components/PremiumButton';
import Input from '../components/Input';
import api from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TEACHER_COLORS = [
    '#EF4444', '#EC4899', '#A855F7', '#8B5CF6', '#3B82F6',
    '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#64748B'
];

export default function AdminScreen() {
    const [activeTab, setActiveTab] = useState('Students');
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const { user } = useContext(AuthContext);

    // --- User Form State ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [role, setRole] = useState('Regular');
    const [color, setColor] = useState(TEACHER_COLORS[0]);

    // --- Group Form State ---
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');

    // --- Student Form State (Manual Registration) ---
    const [studentId, setStudentId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [studentApPat, setStudentApPat] = useState('');
    const [studentApMat, setStudentApMat] = useState('');
    const [studentDob, setStudentDob] = useState('');
    const [studentBlood, setStudentBlood] = useState('');
    const [studentGroup, setStudentGroup] = useState('');
    const [studentAllergies, setStudentAllergies] = useState('');
    const [studentChronic, setStudentChronic] = useState('');
    const [studentTutorPhone, setStudentTutorPhone] = useState('');
    const [studentPhone, setStudentPhone] = useState('');

    // --- Move Student Modal State ---
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [targetGroup, setTargetGroup] = useState('');

    // --- View Group Students Modal State ---
    const [groupModalVisible, setGroupModalVisible] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupStudents, setGroupStudents] = useState([]);

    // --- Group Selector Modal State (Registration) ---
    const [groupSelectorVisible, setGroupSelectorVisible] = useState(false);

    useEffect(() => {
        if (activeTab === 'Users') fetchUsers();
        if (activeTab === 'Groups') fetchGroups();
        if (activeTab === 'Students') fetchStudents();
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const data = await api.get('/users');
            if (data) setUsers(data);
        } catch (e) { }
    };

    const fetchGroups = async () => {
        try {
            const data = await api.get('/groups');
            if (data) setGroups(data);
        } catch (e) { }
    };

    const fetchStudents = async () => {
        try {
            const data = await api.getEmergencyStudents();
            if (data) setStudents(data);
        } catch (e) { }
    };

    // --- Handlers ---

    const handleCreateUser = async () => {
        try {
            const response = await api.post('/users', { username, password, role, color, nombre });
            Alert.alert('Success', 'User created');
            setUsername(''); setPassword(''); setNombre(''); fetchUsers();
        } catch (e) { Alert.alert('Error', 'Failed to create user'); }
    };

    const handleCreateGroup = async () => {
        try {
            const response = await api.post('/groups', { name: groupName, description: groupDesc });
            Alert.alert('Success', 'Group created');
            setGroupName(''); setGroupDesc(''); fetchGroups();
        } catch (e) { Alert.alert('Error', 'Failed to create group'); }
    };

    const handleCreateStudent = async () => {
        try {
            if (!studentId || !studentName || !studentApPat) {
                Alert.alert('Error', 'ID, First Name and Last Name are required');
                return;
            }

            const payload = {
                id: studentId,
                nombre: studentName,
                apellido_paterno: studentApPat,
                apellido_materno: studentApMat || '',
                fecha_nacimiento: studentDob || '2010-01-01',
                tipo_de_sangre: studentBlood || 'O+',
                alergias: studentAllergies || null,
                enfermedades_cronicas: studentChronic || null,
                numero_telefono: studentPhone || null,
                numero_tutor: studentTutorPhone || null,
                grupo: studentGroup || null
            };

            await api.createStudent(payload);
            Alert.alert('Success', 'Student registered');
            setStudentId(''); setStudentName(''); setStudentApPat(''); setStudentApMat('');
            setStudentAllergies(''); setStudentChronic(''); setStudentPhone(''); setStudentTutorPhone(''); setStudentBlood(''); setStudentDob('');
            fetchStudents();
        } catch (e) { Alert.alert('Error', 'Failed to register student'); }
    };

    const openMoveModal = (student) => {
        setSelectedStudent(student);
        setTargetGroup('');
        setModalVisible(true);
    };

    const handleMoveStudent = async () => {
        if (!selectedStudent || !targetGroup) return;
        try {
            await api.updateStudentGroup(selectedStudent.student.id, targetGroup);
            Alert.alert('Success', 'Student moved updated');
            setModalVisible(false);
            fetchStudents();
        } catch (e) { Alert.alert('Error', 'Failed to move student'); }
    };

    const openGroupModal = async (group) => {
        setSelectedGroup(group);
        setGroupModalVisible(true);

        let allStudents = students;
        if (allStudents.length === 0) {
            const data = await api.getEmergencyStudents();
            if (data) {
                setStudents(data);
                allStudents = data;
            }
        }

        const filtered = allStudents.filter(s => (s.student?.grupo || s.grupo) === group.name);
        setGroupStudents(filtered);
    };

    const renderGroupSelector = () => (
        <View style={styles.groupSelectorContainer}>
            <Text style={styles.label}>Assign Group</Text>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setGroupSelectorVisible(true)}
            >
                <Text style={studentGroup ? styles.dropdownTextActive : styles.dropdownTextPlaceholder}>
                    {studentGroup || "Select Group..."}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

        </View>
    );

    const renderTabButton = (title, icon) => (
        <TouchableOpacity onPress={() => setActiveTab(title)} style={[styles.tabButton, activeTab === title && styles.activeTabButton]}>
            <MaterialCommunityIcons name={icon} size={20} color={activeTab === title ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.tabText, activeTab === title && styles.activeTabText]}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Admin Panel</Text>
            </View>

            <View style={styles.tabContainer}>
                {renderTabButton('Students', 'account-school')}
                {renderTabButton('Groups', 'account-group')}
                {renderTabButton('Users', 'account-multiple')}
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'Students' && (
                    <>
                        <Card style={styles.card}>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="account-plus-outline" size={24} color={COLORS.primary} />
                                <Text style={styles.sectionTitle}>Register New Student</Text>
                            </View>
                            <Input label="Student ID" value={studentId} onChangeText={setStudentId} placeholder="Ex: 1001" keyboardType="numeric" />
                            <Input label="Name" value={studentName} onChangeText={setStudentName} placeholder="Ex: Maria" />
                            <Input label="Last Name (Paterno)" value={studentApPat} onChangeText={setStudentApPat} placeholder="Ex: Garcia" />
                            <Input label="Last Name (Materno)" value={studentApMat} onChangeText={setStudentApMat} placeholder="Ex: Lopez (Optional)" />

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Input label="Birth Date" value={studentDob} onChangeText={setStudentDob} placeholder="YYYY-MM-DD" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Input label="Blood Type" value={studentBlood} onChangeText={setStudentBlood} placeholder="Ex: O+" />
                                </View>
                            </View>

                            <Input label="Allergies" value={studentAllergies} onChangeText={setStudentAllergies} placeholder="Ex: Peanuts, none..." multiline />
                            <Input label="Chronic Diseases" value={studentChronic} onChangeText={setStudentChronic} placeholder="Ex: Asthma, none..." multiline />
                            <Input label="Tutor Phone" value={studentTutorPhone} onChangeText={setStudentTutorPhone} placeholder="Ex: 555-1234" keyboardType="phone-pad" />

                            {renderGroupSelector()}

                            <Button title="Register Student" onPress={handleCreateStudent} style={{ marginTop: SPACING.m }} />
                        </Card>

                        <Text style={styles.listTitle}>All Students</Text>
                        {students.map((item) => (
                            <TouchableOpacity key={item.student.id} style={styles.listItem} onPress={() => openMoveModal(item)}>
                                <View style={[styles.avatar, { backgroundColor: COLORS.surfaceWithOpacity }]}>
                                    <Text style={[styles.avatarText, { fontSize: 14 }]}>{item.student.grupo || '??'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemName}>{item.student.nombre} {item.student.apellido_paterno}</Text>
                                    <Text style={styles.itemSub}>ID: {item.student.id}</Text>
                                </View>
                                <MaterialCommunityIcons name="pencil" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {activeTab === 'Groups' && (
                    <>
                        <Card style={styles.card}>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="account-group" size={24} color={COLORS.primary} />
                                <Text style={styles.sectionTitle}>Create New Group</Text>
                            </View>
                            <Input label="Group Name" value={groupName} onChangeText={setGroupName} placeholder="Ex: 1A" />
                            <Input label="Description" value={groupDesc} onChangeText={setGroupDesc} placeholder="Ex: First Grade Section A" />
                            <Button title="Create Group" onPress={handleCreateGroup} style={{ marginTop: SPACING.m }} />
                        </Card>

                        <Text style={styles.listTitle}>Existing Groups (Tap to View Students)</Text>
                        {groups.map((g) => (
                            <TouchableOpacity key={g.id} style={styles.listItem} onPress={() => openGroupModal(g)}>
                                <View style={[styles.avatar, { backgroundColor: COLORS.surfaceWithOpacity }]}>
                                    <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={styles.itemName}>{g.name}</Text>
                                    <Text style={styles.itemSub}>{g.description || 'No description'}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {activeTab === 'Users' && (
                    <>
                        <Card style={styles.card}>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="account-plus" size={24} color={COLORS.primary} />
                                <Text style={styles.sectionTitle}>Create User</Text>
                            </View>
                            <Input label="Full Name" value={nombre} onChangeText={setNombre} placeholder="Ex: John Doe" />
                            <Input label="Username" value={username} onChangeText={setUsername} placeholder="Ex: john.doe" autoCapitalize="none" />
                            <Input label="Password" value={password} onChangeText={setPassword} placeholder="******" secureTextEntry />
                            <Text style={styles.label}>Role</Text>
                            <View style={styles.roleContainer}>
                                {['Regular', 'Admin', 'Operator', 'Teacher'].map((r) => (
                                    <TouchableOpacity key={r} onPress={() => setRole(r)} style={[styles.roleBtn, role === r && styles.roleBtnActive]}>
                                        <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {role === 'Teacher' && (
                                <View style={styles.colorGrid}>
                                    {TEACHER_COLORS.map((c) => (
                                        <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleActive]} />
                                    ))}
                                </View>
                            )}
                            <Button title="Create User" onPress={handleCreateUser} style={{ marginTop: SPACING.m }} />
                        </Card>
                        <Text style={styles.listTitle}>Existing Users</Text>
                        {users.map((u) => (
                            <View key={u.id} style={styles.listItem}>
                                <View style={[styles.avatar, { backgroundColor: u.color || COLORS.primaryLight }]}>
                                    <Text style={styles.avatarText}>{u.nombre.charAt(0)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemName}>{u.nombre}</Text>
                                    <Text style={styles.itemSub}>{u.username} • {u.role}</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* Move Student Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Move Student</Text>
                        <Text style={styles.modalSubtitle}>
                            Move {selectedStudent?.student.nombre} from group {selectedStudent?.student.grupo || 'None'}
                        </Text>

                        {/* Group Selector for Move Modal */}
                        <View style={styles.groupSelectorContainer}>
                            <Text style={styles.label}>New Group</Text>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setGroupSelectorVisible(true)}
                            >
                                <Text style={targetGroup ? styles.dropdownTextActive : styles.dropdownTextPlaceholder}>
                                    {targetGroup || "Select Target Group..."}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <Button title="Cancel" onPress={() => setModalVisible(false)} variant="outline" style={{ flex: 1, marginRight: 8 }} />
                            <Button title="Move" onPress={handleMoveStudent} style={{ flex: 1, marginLeft: 8 }} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Reused Group Selector Modal (Shared state with registration for simplicity, or we can separate if needed) 
                Actually, using the same state 'studentGroup' for registration and 'targetGroup' for moving might conflict if both active.
                The previous rewrite added 'groupSelectorVisible' state. 
                Let's make the modal usage generic or separate. 
                For this file, I will modify the EXISTING modal block (lines 175-205) to handle both or add a second one?
                Better: Make the picker modal setting generic. 
                
                Let's use a new state 'pickerTarget' : 'register' | 'move' 
            */}

            {/* Generic Group Picker Modal */}
            <Modal visible={groupSelectorVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setGroupSelectorVisible(false)}
                >
                    <View style={styles.pickerModalContent}>
                        <Text style={styles.modalTitle}>Select Group</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {groups.map(g => (
                                <TouchableOpacity
                                    key={g.id}
                                    style={[styles.pickerItem, (modalVisible ? targetGroup : studentGroup) === g.name && styles.pickerItemActive]}
                                    onPress={() => {
                                        if (modalVisible) {
                                            setTargetGroup(g.name);
                                        } else {
                                            setStudentGroup(g.name);
                                        }
                                        setGroupSelectorVisible(false);
                                    }}
                                >
                                    <Text style={[styles.pickerItemText, (modalVisible ? targetGroup : studentGroup) === g.name && styles.pickerItemTextActive]}>
                                        {g.name}
                                    </Text>
                                    {(modalVisible ? targetGroup : studentGroup) === g.name && (
                                        <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Button title="Close" onPress={() => setGroupSelectorVisible(false)} variant="outline" style={{ marginTop: SPACING.m }} />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* View Group Students Modal */}
            <Modal visible={groupModalVisible} transparent animationType="slide">
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
                    <View style={[styles.modalContent, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, height: '70%', paddingBottom: 40 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Group {selectedGroup?.name}</Text>
                            <TouchableOpacity onPress={() => setGroupModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>{groupStudents.length} Students</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {groupStudents.length > 0 ? (
                                groupStudents.map(item => (
                                    <View key={item.student.id} style={styles.listItem}>
                                        <View style={[styles.avatar, { backgroundColor: COLORS.surfaceWithOpacity }]}>
                                            <MaterialCommunityIcons name="account" size={18} color={COLORS.textSecondary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{item.student.nombre} {item.student.apellido_paterno}</Text>
                                            <Text style={styles.itemSub}>ID: {item.student.id}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: COLORS.textSecondary }}>No students in this group yet.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        backgroundColor: COLORS.surface,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: SPACING.l,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 18,
        color: COLORS.text,
        ...FONTS.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: SPACING.m,
        gap: SPACING.s, // Tighter gap for 3 items
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activeTabButton: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    tabText: {
        fontSize: 12, // Slightly smaller for 3 items
        color: COLORS.textSecondary,
        ...FONTS.medium,
    },
    activeTabText: {
        color: COLORS.primary,
        ...FONTS.bold,
    },
    content: {
        padding: SPACING.l,
        paddingBottom: 120,
    },
    card: {
        marginBottom: SPACING.m,
        backgroundColor: COLORS.surface,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.l,
        paddingBottom: SPACING.s,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: 18,
        color: COLORS.text,
        ...FONTS.bold,
        marginLeft: SPACING.s,
    },
    label: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 8,
        marginTop: SPACING.s,
        ...FONTS.medium,
    },
    roleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: SPACING.l,
    },
    roleBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    roleBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    roleText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        ...FONTS.medium,
    },
    roleTextActive: {
        color: COLORS.white,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: SPACING.l,
    },
    colorCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    colorCircleActive: {
        borderWidth: 3,
        borderColor: COLORS.text,
    },
    listTitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: SPACING.m,
        marginBottom: SPACING.m,
        ...FONTS.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    listItem: {
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: LAYOUT.radius.m,
        marginBottom: SPACING.s,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.small,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarText: {
        color: COLORS.text,
        fontSize: 18,
        ...FONTS.bold,
    },
    itemName: {
        fontSize: 16,
        color: COLORS.text,
        ...FONTS.bold,
    },
    itemSub: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.l,
        ...SHADOWS.large,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        color: COLORS.text,
        ...FONTS.bold,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.l,
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: SPACING.m,
    },

    // Dropdown Styles
    dropdownButton: {
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: LAYOUT.radius.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    dropdownTextPlaceholder: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    dropdownTextActive: {
        color: COLORS.text,
        fontSize: 16,
        ...FONTS.medium,
    },
    pickerModalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.l,
        padding: SPACING.l,
        width: '80%',
        maxHeight: '60%',
        ...SHADOWS.large,
    },
    pickerItem: {
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerItemActive: {
        backgroundColor: COLORS.primary,
        borderRadius: LAYOUT.radius.m,
        borderBottomWidth: 0,
    },
    pickerItemText: {
        fontSize: 16,
        color: COLORS.text,
    },
    pickerItemTextActive: {
        color: COLORS.white,
        ...FONTS.bold,
    },

    groupSelectorContainer: {
        marginBottom: SPACING.m,
    },
});
