import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Button, Surface, IconButton, List, Divider, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const AssignTaskScreen = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [subtasks, setSubtasks] = useState([{ title: '', completed: false }]);
    const [deadline, setDeadline] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [staffList, setStaffList] = useState([]);
    const [planList, setPlanList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { getPlans, assignTask, getStaff } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [plans, staff] = await Promise.all([
                    getPlans().catch(() => []),
                    getStaff().catch(() => [])
                ]);
                setPlanList(plans);
                setStaffList(staff);
            } catch (error) {
                console.error('Fetch error:', error);
                Alert.alert('Error', 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [getPlans, getStaff]);

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setTitle(plan.name);
        setDescription(plan.description);
        setSubtasks(plan.subtasks.map(s => ({ title: s.title, completed: false })));

        // Auto-calculate deadline from plan's maxDays
        if (plan.maxDays) {
            const autoDeadline = new Date();
            autoDeadline.setDate(autoDeadline.getDate() + plan.maxDays);
            setDeadline(autoDeadline);
        }
    };

    const handleAssign = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }
        if (!selectedStaff) {
            Alert.alert('Error', 'Please select a staff member');
            return;
        }
        if (!deadline) {
            Alert.alert('Error', 'Please set a deadline');
            return;
        }

        // Ensure we have at least one subtask
        const validSubtasks = subtasks.filter(s => s.title && s.title.trim());
        if (validSubtasks.length === 0) {
            Alert.alert('Error', 'Please add at least one subtask');
            return;
        }

        setSaving(true);
        try {
            console.log('Assigning task:', {
                title,
                description,
                assignedTo: selectedStaff._id,
                planId: selectedPlan?._id,
                subtasks: validSubtasks,
                deadline: deadline.toISOString()
            });

            const result = await assignTask({
                title,
                description,
                assignedTo: selectedStaff._id,
                planId: selectedPlan?._id,
                subtasks: validSubtasks,
                deadline: deadline.toISOString()
            });

            console.log('Task created:', result);
            Alert.alert('Success', `Task "${title}" assigned to ${selectedStaff.name}!`);
            navigation.goBack();
        } catch (error) {
            console.error('Assignment error:', error);
            Alert.alert('Error', error.message || 'Failed to assign task');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Assign Task</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Surface style={styles.surface} elevation={2}>
                    <Text style={styles.label}>Select Staff Member</Text>
                    {staffList.length === 0 ? (
                        <Text style={styles.emptyText}>No staff available. Create staff first.</Text>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planScroll}>
                            {staffList.map(staff => (
                                <TouchableOpacity
                                    key={staff._id}
                                    style={[styles.planChip, selectedStaff?._id === staff._id && styles.selectedPlan]}
                                    onPress={() => setSelectedStaff(staff)}
                                >
                                    <Text style={selectedStaff?._id === staff._id ? styles.selectedPlanText : {}}>{staff.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>Select Plan Template (Optional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planScroll}>
                        <TouchableOpacity
                            style={[styles.planChip, !selectedPlan && styles.selectedPlan]}
                            onPress={() => {
                                setSelectedPlan(null);
                                setTitle('');
                                setDescription('');
                                setSubtasks([{ title: 'Task Step 1', completed: false }]);
                            }}
                        >
                            <Text style={!selectedPlan ? styles.selectedPlanText : {}}>Self plan</Text>
                        </TouchableOpacity>
                        {planList.map(plan => (
                            <TouchableOpacity
                                key={plan._id}
                                style={[styles.planChip, selectedPlan?._id === plan._id && styles.selectedPlan]}
                                onPress={() => handleSelectPlan(plan)}
                            >
                                <Text style={selectedPlan?._id === plan._id ? styles.selectedPlanText : {}}>{plan.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Divider style={styles.divider} />

                    <TextInput
                        style={styles.input}
                        placeholder="Task Title"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Task Description"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />

                    <Text style={styles.label}>Deadline</Text>
                    {selectedPlan?.maxDays && (
                        <Text style={styles.autoDeadlineInfo}>
                            📅 Auto-set from plan: {selectedPlan.maxDays} days ({deadline.toLocaleDateString()})
                        </Text>
                    )}
                    {Platform.OS === 'web' ? (
                        <View style={styles.dateRow}>
                            <input
                                type="date"
                                value={deadline.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    const date = new Date(e.target.value);
                                    if (!isNaN(date.getTime())) setDeadline(date);
                                }}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    fontSize: 16,
                                    borderRadius: 10,
                                    border: '1px solid #eee',
                                    backgroundColor: '#f9f9f9',
                                }}
                            />
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
                                <Text>{deadline.toDateString()}</Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={deadline}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowDatePicker(false);
                                        if (date) setDeadline(date);
                                    }}
                                />
                            )}
                        </>
                    )}
                    <Text style={styles.hintText}>
                        💡 You can change the date manually if needed
                    </Text>

                    <Button
                        mode="contained"
                        onPress={handleAssign}
                        loading={saving}
                        disabled={saving || loading}
                        style={styles.assignButton}
                    >
                        Assign Task
                    </Button>
                </Surface>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 40,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    scrollContent: {
        padding: 20,
    },
    surface: {
        padding: 20,
        borderRadius: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    input: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 15,
    },
    textArea: {
        height: 60,
    },
    divider: {
        marginVertical: 15,
    },
    planScroll: {
        marginBottom: 10,
    },
    planChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#eee',
        marginRight: 10,
    },
    selectedPlan: {
        backgroundColor: '#2196F3',
    },
    selectedPlanText: {
        color: '#fff',
    },
    datePicker: {
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 20,
    },
    dateInput: {
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 20,
        fontSize: 16,
    },
    assignButton: {
        borderRadius: 10,
    },
    infoText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    autoDeadlineInfo: {
        fontSize: 13,
        color: '#10b981',
        backgroundColor: '#d1fae5',
        padding: 8,
        borderRadius: 8,
        marginBottom: 10,
    },
    hintText: {
        fontSize: 12,
        color: '#888',
        marginBottom: 15,
        fontStyle: 'italic',
    },
});

export default AssignTaskScreen;
