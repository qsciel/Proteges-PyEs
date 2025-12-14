import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS, SPACING, FONTS, SHADOWS, LAYOUT } from '../theme';
import Card from '../components/Card';
import Button from '../components/PremiumButton';
import Input from '../components/Input';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/apiConfig';
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

    // --- Search State ---
    const [searchText, setSearchText] = useState('');

    // --- View Mode State (List vs Create) ---
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'

    // Reset view mode when tab changes
    useEffect(() => {
        setViewMode('list');
        setSearchText('');
    }, [activeTab]);

    const getFilteredData = () => {
        const text = searchText.toLowerCase();
        if (activeTab === 'Students') {
            return students.filter(s =>
                (s.names + ' ' + s.paternal_last_name).toLowerCase().includes(text) ||
                s.id.toString().includes(text) ||
                (s.group || '').toLowerCase().includes(text)
            );
        }
        if (activeTab === 'Groups') {
            return groups.filter(g =>
                g.name.toLowerCase().includes(text) ||
                (g.description || '').toLowerCase().includes(text)
            );
        }
        if (activeTab === 'Users') {
            return users.filter(u =>
                (u.display_name || '').toLowerCase().includes(text) ||
                (u.username || '').toLowerCase().includes(text) ||
                (u.role || '').toLowerCase().includes(text)
            );
        }
        return [];
    };

    useEffect(() => {
        // Fetch groups on mount so they are available for registration/editing
        fetchGroups();
    }, []);

    useEffect(() => {
        if (activeTab === 'Users') fetchUsers();
        // Groups already fetched on mount, but refreshing is fine
        if (activeTab === 'Students') fetchStudents();
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const data = await api.get(API_ENDPOINTS.USERS);
            if (data) setUsers(data);
        } catch (e) { }
    };

    const fetchGroups = async () => {
        try {
            const data = await api.get('/groups');
            if (data) {
                // Map backend ID to name for display compatibility
                const mappedGroups = data.map(g => ({
                    ...g,
                    name: g.id // Use ID as the name (e.g., "5APM")
                }));
                setGroups(mappedGroups);
            }
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
            // Note: Backend likely expects /user/create or similar if /users was just for GET.
            // But usually POST /user is common. Let's check apiConfig or backend routing.
            // Backend `user_routes.rs`: route("/create", post(create_user)) nested under /user
            // So it should be /user/create
            const response = await api.post('/user/create', { username, password, role, color, nombre });
            Alert.alert('Éxito', 'Usuario creado correctamente');
            setUsername(''); setPassword(''); setNombre(''); fetchUsers();
        } catch (e) { Alert.alert('Error', 'Fallo al crear usuario'); }
    };

    const handleCreateGroup = async () => {
        try {
            const response = await api.post('/groups', { name: groupName, description: groupDesc });
            Alert.alert('Éxito', 'Grupo creado correctamente');
            setGroupName(''); setGroupDesc(''); fetchGroups();
        } catch (e) { Alert.alert('Error', 'Fallo al crear grupo'); }
    };

    const handleCreateStudent = async () => {
        try {
            if (!studentId || !studentName || !studentApPat) {
                Alert.alert('Error', 'ID, Nombre y Apellido Paterno son obligatorios');
                return;
            }

            const payload = {
                id: studentId,
                names: studentName,
                paternal_last_name: studentApPat,
                maternal_last_name: studentApMat || '',
                birth_date: studentDob || '2010-01-01',
                blood_type: studentBlood || 'O+',
                allergies: studentAllergies || null,
                chronic_conditions: studentChronic || null,
                phone_number: studentPhone || null,
                guardian_phone: studentTutorPhone || null,
                group: studentGroup || null
            };

            await api.createStudent(payload);
            Alert.alert('Éxito', 'Estudiante registrado correctamente');
            setStudentId(''); setStudentName(''); setStudentApPat(''); setStudentApMat('');
            setStudentAllergies(''); setStudentChronic(''); setStudentPhone(''); setStudentTutorPhone(''); setStudentBlood(''); setStudentDob('');
            fetchStudents();
        } catch (e) { Alert.alert('Error', 'Fallo al registrar estudiante'); }
    };

    const openEditModal = (student) => {
        setSelectedStudent(student);
        // Populate form with existing data
        setStudentId(student.id);
        setStudentName(student.names);
        setStudentApPat(student.paternal_last_name);
        setStudentApMat(student.maternal_last_name || '');
        setStudentDob(student.birth_date);
        setStudentBlood(student.blood_type || '');
        setStudentGroup(student.group);
        setStudentAllergies(student.allergies || '');
        setStudentChronic(student.chronic_diseases || '');
        setStudentTutorPhone(student.primary_guardian_phone || '');
        setStudentPhone(student.personal_phone || '');

        setModalVisible(true);
    };

    const handleUpdateStudent = async () => {
        if (!selectedStudent) return;
        try {
            const payload = {
                names: studentName,
                paternal_last_name: studentApPat,
                maternal_last_name: studentApMat || null,
                birth_date: studentDob || '2010-01-01',
                major: selectedStudent.major || 'General', // Keep existing or default
                group: studentGroup,
                blood_type: studentBlood || null,
                allergies: studentAllergies || null,
                chronic_conditions: studentChronic || null,
                domicile: selectedStudent.domicile || null, // Keep existing if not editing
                personal_phone: studentPhone || null,
                primary_guardian_phone: studentTutorPhone || null,
                secondary_guardian_phone: null,
                emergency_phone: null
            };

            await api.updateStudent(selectedStudent.id, payload);
            Alert.alert('Éxito', 'Estudiante actualizado correctamente');
            setModalVisible(false);
            fetchStudents();

            // Clear form
            setStudentId(''); setStudentName(''); setStudentApPat(''); setStudentApMat('');
            setStudentAllergies(''); setStudentChronic(''); setStudentPhone(''); setStudentTutorPhone(''); setStudentBlood(''); setStudentDob(''); setStudentGroup('');
        } catch (e) { Alert.alert('Error', 'Fallo al actualizar estudiante'); }
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

        const filtered = allStudents.filter(s => (s.group) === group.name);
        setGroupStudents(filtered);
    };

    const renderGroupSelector = () => (
        <View style={styles.groupSelectorContainer}>
            <Text style={styles.label}>Asignar Grupo</Text>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setGroupSelectorVisible(true)}
            >
                <Text style={studentGroup ? styles.dropdownTextActive : styles.dropdownTextPlaceholder}>
                    {studentGroup || "Seleccionar Grupo..."}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

        </View>
    );

    const renderTabButton = (title, displayTitle, icon) => (
        <TouchableOpacity onPress={() => setActiveTab(title)} style={[styles.tabButton, activeTab === title && styles.activeTabButton]}>
            <MaterialCommunityIcons name={icon} size={20} color={activeTab === title ? COLORS.primary : COLORS.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.tabText, activeTab === title && styles.activeTabText]}>{displayTitle}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Panel de Administración</Text>
            </View>

            <View style={styles.tabContainer}>
                {renderTabButton('Students', 'Estudiantes', 'account-school')}
                {renderTabButton('Groups', 'Grupos', 'account-group')}
                {renderTabButton('Users', 'Usuarios', 'account-multiple')}
            </View>

            {/* Sub-Navigation Buttons (Create vs View) */}
            <View style={styles.subNavContainer}>
                <TouchableOpacity
                    style={[styles.subNavBtn, viewMode === 'list' && styles.subNavBtnActive]}
                    onPress={() => setViewMode('list')}
                >
                    <Text style={[styles.subNavText, viewMode === 'list' && styles.subNavTextActive]}>Ver Lista</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.subNavBtn, viewMode === 'create' && styles.subNavBtnActive]}
                    onPress={() => setViewMode('create')}
                >
                    <Text style={[styles.subNavText, viewMode === 'create' && styles.subNavTextActive]}>
                        {activeTab === 'Students' ? 'Registrar Estudiante' :
                            activeTab === 'Groups' ? 'Crear Grupo' : 'Crear Usuario'}
                    </Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'list' && (
                <View style={{ paddingHorizontal: SPACING.l, marginBottom: SPACING.s }}>
                    <Input
                        placeholder="Buscar..."
                        value={searchText}
                        onChangeText={setSearchText}
                        icon="magnify"
                    />
                </View>
            )}

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* STUDENTS TAB */}
                {activeTab === 'Students' && (
                    <>
                        {viewMode === 'create' ? (
                            <Card style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <MaterialCommunityIcons name="account-plus-outline" size={24} color={COLORS.primary} />
                                    <Text style={styles.sectionTitle}>Registrar Nuevo Estudiante</Text>
                                </View>
                                <Input label="ID Estudiante" value={studentId} onChangeText={setStudentId} placeholder="Ej: 1001" keyboardType="numeric" />
                                <Input label="Nombre" value={studentName} onChangeText={setStudentName} placeholder="Ej: Maria" />
                                <Input label="Apellido Paterno" value={studentApPat} onChangeText={setStudentApPat} placeholder="Ej: Garcia" />
                                <Input label="Apellido Materno" value={studentApMat} onChangeText={setStudentApMat} placeholder="Ej: Lopez (Opcional)" />

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Input label="Fecha Nacimiento" value={studentDob} onChangeText={setStudentDob} placeholder="AAAA-MM-DD" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Input label="Tipo Sangre" value={studentBlood} onChangeText={setStudentBlood} placeholder="Ej: O+" />
                                    </View>
                                </View>

                                <Input label="Alergias" value={studentAllergies} onChangeText={setStudentAllergies} placeholder="Ej: Nueces, ninguna..." multiline />
                                <Input label="Enfermedades Crónicas" value={studentChronic} onChangeText={setStudentChronic} placeholder="Ej: Asma, ninguna..." multiline />
                                <Input label="Teléfono Tutor" value={studentTutorPhone} onChangeText={setStudentTutorPhone} placeholder="Ej: 555-1234" keyboardType="phone-pad" />

                                {renderGroupSelector()}

                                <Button title="Registrar Estudiante" onPress={handleCreateStudent} style={{ marginTop: SPACING.m }} />
                            </Card>
                        ) : (
                            <>
                                <Text style={styles.listTitle}>Todos los Estudiantes ({getFilteredData().length})</Text>
                                {getFilteredData().length === 0 ? (
                                    <Text style={{ textAlign: 'center', color: COLORS.textSecondary, marginTop: 20 }}>No se encontraron estudiantes.</Text>
                                ) : (
                                    getFilteredData().map((item) => (
                                        <TouchableOpacity key={item.id} style={styles.listItem} onPress={() => openEditModal(item)}>
                                            <View style={[styles.avatar, { backgroundColor: COLORS.surfaceWithOpacity }]}>
                                                <Text style={[styles.avatarText, { fontSize: 14 }]}>{item.group || '??'}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemName}>{item.names} {item.paternal_last_name}</Text>
                                                <Text style={styles.itemSub}>ID: {item.id} • {item.blood_type || 'N/A'}</Text>
                                            </View>
                                            <MaterialCommunityIcons name="pencil" size={20} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                    ))
                                )}
                            </>
                        )}
                    </>
                )}

                {/* GROUPS TAB */}
                {activeTab === 'Groups' && (
                    <>
                        {viewMode === 'create' ? (
                            <Card style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <MaterialCommunityIcons name="account-group" size={24} color={COLORS.primary} />
                                    <Text style={styles.sectionTitle}>Crear Nuevo Grupo</Text>
                                </View>
                                <Input label="Nombre del Grupo" value={groupName} onChangeText={setGroupName} placeholder="Ej: 1A" />
                                <Input label="Descripción" value={groupDesc} onChangeText={setGroupDesc} placeholder="Ej: Primer Grado Sección A" />
                                <Button title="Crear Grupo" onPress={handleCreateGroup} style={{ marginTop: SPACING.m }} />
                            </Card>
                        ) : (
                            <>
                                <Text style={styles.listTitle}>Grupos Existentes ({getFilteredData().length})</Text>
                                {getFilteredData().map((g) => (
                                    <TouchableOpacity key={g.id} style={styles.listItem} onPress={() => openGroupModal(g)}>
                                        <View style={[styles.avatar, { backgroundColor: COLORS.surfaceWithOpacity }]}>
                                            <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
                                        </View>
                                        <View>
                                            <Text style={styles.itemName}>{g.name}</Text>
                                            <Text style={styles.itemSub}>{g.description || 'Sin descripción'}</Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </>
                )}

                {/* USERS TAB */}
                {activeTab === 'Users' && (
                    <>
                        {viewMode === 'create' ? (
                            <Card style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <MaterialCommunityIcons name="account-plus" size={24} color={COLORS.primary} />
                                    <Text style={styles.sectionTitle}>Crear Usuario</Text>
                                </View>
                                <Input label="Nombre Completo" value={nombre} onChangeText={setNombre} placeholder="Ej: Juan Perez" />
                                <Input label="Usuario" value={username} onChangeText={setUsername} placeholder="Ej: juan.perez" autoCapitalize="none" />
                                <Input label="Contraseña" value={password} onChangeText={setPassword} placeholder="******" secureTextEntry />
                                <Text style={styles.label}>Rol</Text>
                                <View style={styles.roleContainer}>
                                    {['Docente', 'Prefecto', 'Doctor', 'Director', 'Operador'].map((r) => (
                                        <TouchableOpacity key={r} onPress={() => setRole(r)} style={[styles.roleBtn, role === r && styles.roleBtnActive]}>
                                            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {role === 'Docente' && (
                                    <View style={styles.colorGrid}>
                                        {TEACHER_COLORS.map((c) => (
                                            <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleActive]} />
                                        ))}
                                    </View>
                                )}
                                <Button title="Crear Usuario" onPress={handleCreateUser} style={{ marginTop: SPACING.m }} />
                            </Card>
                        ) : (
                            <>
                                <Text style={styles.listTitle}>Usuarios Existentes ({getFilteredData().length})</Text>
                                {getFilteredData().map((u) => (
                                    <View key={u.id} style={styles.listItem}>
                                        <View style={[styles.avatar, { backgroundColor: u.color || COLORS.primaryLight }]}>
                                            <Text style={styles.avatarText}>{(u.display_name || 'U').charAt(0)}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{u.display_name || 'Usuario'}</Text>
                                            <Text style={styles.itemSub}>{u.username} • {u.role}</Text>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Move Student Modal */}
            {/* Edit Student Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '90%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Editar Estudiante</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.itemSub}>ID: {selectedStudent?.id}</Text>

                            <View style={{ marginTop: 10 }}>
                                <Input label="Nombre" value={studentName} onChangeText={setStudentName} />
                                <Input label="Apellido Paterno" value={studentApPat} onChangeText={setStudentApPat} />
                                <Input label="Apellido Materno (Opcional)" value={studentApMat} onChangeText={setStudentApMat} />

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Input label="Fecha Nacimiento" value={studentDob} onChangeText={setStudentDob} placeholder="AAAA-MM-DD" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Input label="Tipo Sangre" value={studentBlood} onChangeText={setStudentBlood} />
                                    </View>
                                </View>

                                {renderGroupSelector()}

                                <Input label="Alergias" value={studentAllergies} onChangeText={setStudentAllergies} multiline />
                                <Input label="Enf. Crónicas" value={studentChronic} onChangeText={setStudentChronic} multiline />
                                <Input label="Tel. Tutor" value={studentTutorPhone} onChangeText={setStudentTutorPhone} keyboardType="phone-pad" />
                                <Input label="Tel. Personal" value={studentPhone} onChangeText={setStudentPhone} keyboardType="phone-pad" />
                            </View>

                            <View style={styles.modalButtons}>
                                <Button title="Cancelar" onPress={() => setModalVisible(false)} variant="outline" style={{ flex: 1, marginRight: 8 }} />
                                <Button title="Guardar Cambios" onPress={handleUpdateStudent} style={{ flex: 1, marginLeft: 8 }} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Generic Group Picker Modal */}
            <Modal visible={groupSelectorVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setGroupSelectorVisible(false)}
                >
                    <View style={styles.pickerModalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Grupo</Text>
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
                        <Button title="Cerrar" onPress={() => setGroupSelectorVisible(false)} variant="outline" style={{ marginTop: SPACING.m }} />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* View Group Students Modal */}
            <Modal visible={groupModalVisible} transparent animationType="slide">
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
                    <View style={[styles.modalContent, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, height: '70%', paddingBottom: 40 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Grupo {selectedGroup?.name}</Text>
                            <TouchableOpacity onPress={() => setGroupModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>{groupStudents.length} Estudiantes</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {groupStudents.length > 0 ? (
                                groupStudents.map(item => (
                                    <View key={item.id} style={styles.listItem}>
                                        <View style={[styles.avatar, { backgroundColor: COLORS.surfaceWithOpacity }]}>
                                            <MaterialCommunityIcons name="account" size={18} color={COLORS.textSecondary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{item.names} {item.paternal_last_name}</Text>
                                            <Text style={styles.itemSub}>ID: {item.id}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: COLORS.textSecondary }}>No hay estudiantes en este grupo.</Text>
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

    // Sub Navigation (View Toggle)
    subNavContainer: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.s,
        marginTop: SPACING.s,
        gap: SPACING.m,
    },
    subNavBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.radius.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    subNavBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    subNavText: {
        fontSize: 14,
        color: COLORS.text,
        ...FONTS.medium,
    },
    subNavTextActive: {
        color: COLORS.white,
        ...FONTS.bold,
    },
});
