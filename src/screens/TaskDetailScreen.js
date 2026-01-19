import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TextInput, Modal } from 'react-native';
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
    const { getTasks, updateTaskProgress, reviewTask, userRole } = useAuth();

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

    const toggleSubtask = (index) => {
        if (userRole !== 'staff' || task.status === 'completed' || task.status === 'waiting_approval') return;
        const newSubtasks = [...task.subtasks];
        newSubtasks[index].completed = !newSubtasks[index].completed;
        setTask({ ...task, subtasks: newSubtasks });
    };

    const updateReason = (text, index) => {
        const newSubtasks = [...task.subtasks];
        newSubtasks[index].reason = text;
        setTask({ ...task, subtasks: newSubtasks });
    };

    const handleStaffSubmit = async () => {
        const allDone = task.subtasks.every(s => s.completed);
        if (allDone) {
            setModalVisible(true);
        } else {
            // Just update progress if not done
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
            Alert.alert('Success', status === 'completed' ? 'Approval Requested' : 'Progress Saved');
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
                        <Text style={styles.label}>Status:</Text>
                        <Chip>{task.status.replace('_', ' ').toUpperCase()}</Chip>
                    </View>

                    {task.rejectionReason ? (
                        <View style={styles.rejectionBox}>
                            <Text style={styles.rejectionTitle}>⚠️ Admin Feedback:</Text>
                            <Text style={styles.rejectionText}>{task.rejectionReason}</Text>
                        </View>
                    ) : null}

                    <Divider style={styles.divider} />

                    <Text style={styles.sectionTitle}>Subtasks</Text>
                    {task.subtasks.map((subtask, index) => (
                        <View key={index} style={styles.subtaskItem}>
                            <View style={styles.subtaskRow}>
                                <Checkbox
                                    status={subtask.completed ? 'checked' : 'unchecked'}
                                    onPress={() => toggleSubtask(index)}
                                    disabled={userRole !== 'staff' || task.status === 'waiting_approval'}
                                />
                                <Text style={[styles.subtaskTitle, subtask.completed && styles.completedText]}>
                                    {subtask.title}
                                </Text>
                            </View>
                            {subtask.completed && (
                                <TextInput
                                    style={styles.reasonInput}
                                    placeholder="Note/Reason (Optional)"
                                    value={subtask.reason}
                                    onChangeText={(text) => updateReason(text, index)}
                                    editable={userRole === 'staff' && task.status !== 'waiting_approval'}
                                />
                            )}
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
                            {task.subtasks.every(s => s.completed) ? 'Request Approval' : 'Save Progress'}
                        </Button>
                    )}

                    {/* Admin Actions */}
                    {userRole === 'admin' && task.status === 'waiting_approval' && (
                        <View style={styles.adminActions}>
                            <Text style={styles.sectionTitle}>Wait for Approval</Text>
                            {task.submissionNote ? (
                                <View style={styles.noteBox}>
                                    <Text style={styles.label}>Staff Note:</Text>
                                    <Text>{task.submissionNote}</Text>
                                </View>
                            ) : null}
                            <View style={styles.buttonRow}>
                                <Button mode="contained" onPress={() => handleAdminReview('completed')} buttonColor="#10b981" style={styles.actionBtn}>
                                    Approve
                                </Button>
                                <Button mode="contained" onPress={() => handleAdminReview('in_progress')} buttonColor="#ef4444" style={styles.actionBtn}>
                                    Reject
                                </Button>
                            </View>
                        </View>
                    )}

                    {task.status === 'waiting_approval' && userRole === 'staff' && (
                        <View style={styles.pendingBox}>
                            <Text style={styles.pendingText}>⏳ Waiting for Admin Approval</Text>
                            <Text style={styles.pendingNote}>You cannot make changes while under review.</Text>
                        </View>
                    )}
                </Surface>
            </ScrollView>

            {/* Submission Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Title>Request Approval</Title>
                        <Text style={{ marginBottom: 10, color: '#666' }}>Add a note for the admin (e.g., "Site work done, photos sent via WhatsApp")</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter notes..."
                            value={submissionNote}
                            onChangeText={setSubmissionNote}
                            multiline
                        />
                        <View style={styles.modalButtons}>
                            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
                            <Button mode="contained" onPress={() => saveProgress('completed')}>Send Request</Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Rejection Modal */}
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
                            <Button mode="contained" onPress={() => handleAdminReview('in_progress')} buttonColor="#ef4444">Reject Task</Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 40,
        backgroundColor: '#fff',
        elevation: 2,
    },
    headerTitle: {
        marginLeft: 10,
    },
    scrollContent: {
        padding: 15,
    },
    surface: {
        padding: 20,
        borderRadius: 15,
        backgroundColor: '#fff',
    },
    divider: {
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtaskItem: {
        marginBottom: 15,
    },
    subtaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subtaskTitle: {
        fontSize: 16,
        marginLeft: 5,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    reasonInput: {
        backgroundColor: '#f9f9f9',
        padding: 8,
        borderRadius: 5,
        marginTop: 5,
        marginLeft: 40,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#eee',
    },
    updateButton: {
        marginTop: 20,
        borderRadius: 10,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    taskTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        flex: 1,
    },
    description: {
        color: '#666',
        marginBottom: 10,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    label: {
        fontWeight: 'bold',
        marginRight: 10,
    },
    rejectionBox: {
        backgroundColor: '#fee2e2',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    rejectionTitle: {
        color: '#b91c1c',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    rejectionText: {
        color: '#b91c1c',
    },
    adminActions: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f0f9ff',
        borderRadius: 10,
    },
    noteBox: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
    },
    pendingBox: {
        marginTop: 20,
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fffbeb',
        borderRadius: 10,
    },
    pendingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#d97706',
    },
    pendingNote: {
        fontSize: 12,
        color: '#b45309',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
    },
    modalInput: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
});

export default TaskDetailScreen;
