import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TextInput } from 'react-native';
import { Button, Surface, IconButton, Checkbox, Title, Paragraph, Divider, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const TaskDetailScreen = ({ route, navigation }) => {
    const { taskId } = route.params;
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const { getTasks, updateTaskProgress, userRole } = useAuth();

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const tasks = await getTasks();
                const foundTask = tasks.find(t => t._id === taskId);
                if (foundTask) setTask(foundTask);
            } catch (error) {
                Alert.alert('Error', 'Failed to load task details');
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [taskId, getTasks]);

    const toggleSubtask = (index) => {
        if (userRole !== 'staff') return; // Admin can't complete subtasks? Maybe they can.
        const newSubtasks = [...task.subtasks];
        newSubtasks[index].completed = !newSubtasks[index].completed;
        setTask({ ...task, subtasks: newSubtasks });
    };

    const updateReason = (text, index) => {
        const newSubtasks = [...task.subtasks];
        newSubtasks[index].reason = text;
        setTask({ ...task, subtasks: newSubtasks });
    };

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            // Check if all subtasks are done
            const allDone = task.subtasks.every(s => s.completed);
            const newStatus = allDone ? 'completed' : 'pending';

            await updateTaskProgress(taskId, { subtasks: task.subtasks, status: newStatus });
            Alert.alert('Success', 'Task progress updated');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    if (!task) {
        return (
            <View style={styles.centered}>
                <Text>Task not found</Text>
                <Button onPress={() => navigation.goBack()}>Go Back</Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Title style={styles.headerTitle}>Task Details</Title>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Surface style={styles.surface} elevation={2}>
                    <Title>{task.title}</Title>
                    <Paragraph>{task.description}</Paragraph>
                    <Divider style={styles.divider} />

                    <Text style={styles.sectionTitle}>Subtasks</Text>
                    {task.subtasks.map((subtask, index) => (
                        <View key={index} style={styles.subtaskItem}>
                            <View style={styles.subtaskRow}>
                                <Checkbox
                                    status={subtask.completed ? 'checked' : 'unchecked'}
                                    onPress={() => toggleSubtask(index)}
                                    disabled={userRole !== 'staff'}
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
                                    disabled={userRole !== 'staff'}
                                />
                            )}
                        </View>
                    ))}

                    {userRole === 'staff' && (
                        <Button
                            mode="contained"
                            onPress={handleUpdate}
                            loading={updating}
                            disabled={updating}
                            style={styles.updateButton}
                        >
                            Submit Update
                        </Button>
                    )}
                </Surface>
            </ScrollView>
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
});

export default TaskDetailScreen;
