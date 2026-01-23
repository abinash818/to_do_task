import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TextInput, Modal, TouchableOpacity } from 'react-native';
import { Button, Surface, IconButton, Checkbox, Title, Paragraph, Divider, ActivityIndicator, Chip } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const TaskDetailScreen = ({ route, navigation }) => {
    const { taskId } = route.params;
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [submissionNote, setSubmissionNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectModalVisible, setRejectModalVisible] = useState(false);

    const { getTasks, updateTaskProgress, reviewTask, reviewSubtask, userRole, user } = useAuth();

    useEffect(() => {
        fetchTask();
    }, [taskId]);

    const fetchTask = async () => {
        try {
            setLoading(true);
            const tasks = await getTasks();
            const foundTask = tasks.find(t => t._id === taskId);
            if (foundTask) {
                setTask(foundTask);
                if (foundTask.submissionNote) setSubmissionNote(foundTask.submissionNote);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load task details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubtaskStatusChange = async (index, newStatus) => {
        const subtask = task.subtasks[index];
        setUpdating(true);
        try {
            if (userRole === 'staff' && newStatus === 'waiting_approval') {
                const newSubtasks = [...task.subtasks];
                newSubtasks[index].status = 'waiting_approval';
                await updateTaskProgress(taskId, { subtasks: newSubtasks });
                Alert.alert('Success', 'Subtask sent for manager approval');
            }
            else if ((userRole === 'manager' || userRole === 'admin') && (newStatus === 'completed' || newStatus === 'rejected')) {
                await reviewSubtask(taskId, subtask._id, newStatus, `Reviewed by ${user.name}`);
                Alert.alert('Success', `Subtask ${newStatus === 'completed' ? 'Approved' : 'Rejected'}`);
            }
            fetchTask();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setUpdating(false);
        }
    };

    const toggleSubtask = (index) => {
        if (userRole !== 'staff' || task.status === 'completed' || task.status === 'waiting_approval') return;
        const subtask = task.subtasks[index];
        if (subtask.status === 'completed' || subtask.status === 'waiting_approval') return;

        handleSubtaskStatusChange(index, 'waiting_approval');
    };

    const handleStaffSubmit = async () => {
        const allDone = task.subtasks.every(s => s.status === 'completed');
        if (allDone) {
            setModalVisible(true);
        } else {
            await saveProgress('pending');
        }
    };

    const saveProgress = async (statusOverride = null) => {
        setUpdating(true);
        try {
            const status = statusOverride || 'pending';
            const updates = { subtasks: task.subtasks, status };
            if (status === 'completed') updates.submissionNote = submissionNote;

            await updateTaskProgress(taskId, updates);
            Alert.alert('Success', status === 'completed' ? 'Final Approval Requested' : 'Progress Saved');
            setModalVisible(false);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleAdminReview = async (status) => {
        if (status === 'in_progress' && !rejectionReason) {
            setRejectModalVisible(true);
            return;
        }

        setUpdating(true);
        try {
            await reviewTask(taskId, status, rejectionReason);
            Alert.alert('Success', `Task ${status === 'completed' ? 'Approved' : 'Rejected'}`);
            setRejectModalVisible(false);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <ActivityIndicator style={styles.centered} size="large" />;
    if (!task) return <View style={styles.centered}><Text>Task not found</Text></View>;

    const daysRemaining = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0;
    const isManagerOfTask = task.managerId?._id === user?._id || task.managerId === user?._id;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Title style={styles.headerTitle}>Task Details</Title>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Surface style={styles.surface} elevation={2}>
                    <View style={styles.titleRow}>
                        <Title style={styles.taskTitle}>{task.title}</Title>
                        <Chip icon="clock" style={{ backgroundColor: isOverdue ? '#fee2e2' : '#d1fae5' }}>
                            {isOverdue ? `Overdue by ${Math.abs(daysRemaining)} days` : `${daysRemaining} Days Left`}
                        </Chip>
                    </View>
                    <Paragraph style={styles.description}>{task.description}</Paragraph>

                    <View style={styles.statusRow}>
                        <Text style={styles.label}>Overall Status:</Text>
                        <Chip>{task.status.replace('_', ' ').toUpperCase()}</Chip>
                    </View>

                    {task.managerId && (
                        <View style={styles.metaRow}>
                            <Text style={styles.label}>Manager:</Text>
                            <Text>{task.managerId.name || 'Assigned'}</Text>
                        </View>
                    )}

                    {task.rejectionReason ? (
                        <View style={styles.rejectionBox}>
                            <Text style={styles.rejectionTitle}>⚠️ Admin Feedback:</Text>
                            <Text style={styles.rejectionText}>{task.rejectionReason}</Text>
                        </View>
                    ) : null}

                    <Divider style={styles.divider} />

                    <Text style={styles.sectionTitle}>Subtasks Approval Flow</Text>
                    {task.subtasks.map((subtask, index) => (
                        <View key={index} style={styles.subtaskItem}>
                            <View style={styles.subtaskRow}>
                                <View style={styles.subtaskContent}>
                                    <Text style={[styles.subtaskTitle, subtask.status === 'completed' && styles.completedText]}>
                                        {subtask.title}
                                    </Text>
                                    <View style={styles.subtaskBadgeRow}>
                                        <Chip
                                            compact
                                            textStyle={{ fontSize: 10 }}
                                            style={{
                                                backgroundColor:
                                                    subtask.status === 'completed' ? '#d1fae5' :
                                                        subtask.status === 'waiting_approval' ? '#fffbeb' :
                                                            subtask.status === 'rejected' ? '#fee2e2' : '#f3f4f6'
                                            }}
                                        >
                                            {subtask.status?.toUpperCase() || 'PENDING'}
                                        </Chip>
                                    </View>
                                </View>

                                {userRole === 'staff' && subtask.status !== 'completed' && subtask.status !== 'waiting_approval' && (
                                    <Button mode="outlined" compact onPress={() => toggleSubtask(index)} style={styles.smallBtn}>
                                        Done
                                    </Button>
                                )}

                                {(userRole === 'admin' || isManagerOfTask) && subtask.status === 'waiting_approval' && (
                                    <View style={styles.managerSubtaskActions}>
                                        <IconButton icon="check-circle" iconColor="#10b981" size={24} onPress={() => handleSubtaskStatusChange(index, 'completed')} />
                                        <IconButton icon="close-circle" iconColor="#ef4444" size={24} onPress={() => handleSubtaskStatusChange(index, 'rejected')} />
                                    </View>
                                )}
                            </View>

                            {subtask.managerNote ? (
                                <Text style={styles.managerNote}>📝 Manager Note: {subtask.managerNote}</Text>
                            ) : null}
                            <Divider style={{ marginTop: 10, backgroundColor: '#f0f0f0' }} />
                        </View>
                    ))}

                    {/* Staff Actions */}
                    {userRole === 'staff' && task.status !== 'completed' && task.status !== 'waiting_approval' && (
                        <Button
                            mode="contained"
                            onPress={handleStaffSubmit}
                            loading={updating}
                            disabled={updating}
                            style={styles.updateButton}
                        >
                            {task.subtasks.every(s => s.status === 'completed') ? 'Request Final Approval' : 'Save Overall Progress'}
                        </Button>
                    )}

                    {/* Admin Actions */}
                    {userRole === 'admin' && task.status === 'waiting_approval' && (
                        <View style={styles.adminActions}>
                            <Text style={styles.sectionTitle}>Final Approval Review</Text>
                            {task.submissionNote ? (
                                <View style={styles.noteBox}>
                                    <Text style={styles.label}>Staff Submission Note:</Text>
                                    <Text>{task.submissionNote}</Text>
                                </View>
                            ) : null}
                            <View style={styles.buttonRow}>
                                <Button mode="contained" onPress={() => handleAdminReview('completed')} buttonColor="#10b981" style={styles.actionBtn}>
                                    Approve Job
                                </Button>
                                <Button mode="contained" onPress={() => handleAdminReview('in_progress')} buttonColor="#ef4444" style={styles.actionBtn}>
                                    Reject Job
                                </Button>
                            </View>
                        </View>
                    )}

                    {task.status === 'waiting_approval' && userRole === 'staff' && (
                        <View style={styles.pendingBox}>
                            <Text style={styles.pendingText}>⏳ Waiting for Final Admin Approval</Text>
                            <Text style={styles.pendingNote}>You cannot make changes while under final review.</Text>
                        </View>
                    )}
                </Surface>
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Title>Final Submission</Title>
                        <Text style={{ marginBottom: 10, color: '#666' }}>Add a note for the admin about the completed job.</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter notes..."
                            value={submissionNote}
                            onChangeText={setSubmissionNote}
                            multiline
                        />
                        <View style={styles.modalButtons}>
                            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
                            <Button mode="contained" onPress={() => saveProgress('completed')}>Submit Job</Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={rejectModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Title>Reject Task</Title>
                        <Text style={{ marginBottom: 10 }}>Reason for rejection:</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. Incomplete documentation"
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            multiline
                        />
                        <View style={styles.modalButtons}>
                            <Button onPress={() => setRejectModalVisible(false)}>Cancel</Button>
                            <Button mode="contained" onPress={() => handleAdminReview('in_progress')} buttonColor="#ef4444">Confirm Reject</Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 40, paddingBottom: 10, backgroundColor: '#fff', elevation: 2 },
    headerTitle: { marginLeft: 10, fontSize: 18, fontWeight: 'bold' },
    scrollContent: { padding: 15 },
    surface: { padding: 20, borderRadius: 16, backgroundColor: '#fff', elevation: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    taskTitle: { fontSize: 20, fontWeight: 'bold', flex: 1, marginRight: 10 },
    description: { color: '#666', marginBottom: 15, lineHeight: 20 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    label: { fontWeight: '700', marginRight: 8, color: '#444' },
    divider: { marginVertical: 15 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    subtaskItem: { marginBottom: 12 },
    subtaskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    subtaskContent: { flex: 1 },
    subtaskTitle: { fontSize: 15, color: '#333', marginBottom: 4 },
    subtaskBadgeRow: { flexDirection: 'row' },
    completedText: { textDecorationLine: 'line-through', color: '#999' },
    smallBtn: { borderRadius: 8 },
    managerSubtaskActions: { flexDirection: 'row', alignItems: 'center' },
    managerNote: { fontSize: 13, color: '#6366f1', marginTop: 4, fontStyle: 'italic' },
    rejectionBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
    rejectionTitle: { color: '#b91c1c', fontWeight: 'bold', marginBottom: 4 },
    rejectionText: { color: '#b91c1c', fontSize: 14 },
    updateButton: { marginTop: 20, borderRadius: 12, paddingVertical: 4 },
    adminActions: { marginTop: 20, padding: 15, backgroundColor: '#f0f9ff', borderRadius: 12 },
    noteBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#e0f2fe' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    actionBtn: { flex: 1, borderRadius: 10 },
    pendingBox: { marginTop: 20, padding: 15, backgroundColor: '#fffbeb', borderRadius: 12, alignItems: 'center' },
    pendingText: { fontSize: 15, fontWeight: 'bold', color: '#d97706', marginBottom: 4 },
    pendingNote: { fontSize: 12, color: '#b45309', textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', padding: 25, borderRadius: 20 },
    modalInput: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, height: 120, textAlignVertical: 'top', marginVertical: 15, borderWidth: 1, borderColor: '#e5e7eb' },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default TaskDetailScreen;
