import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { Button, Surface, IconButton, List, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const EditPlanScreen = ({ route, navigation }) => {
    const { planId } = route.params || {};
    const isEdit = !!planId;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [maxDays, setMaxDays] = useState('7');
    const [subtasks, setSubtasks] = useState([{ title: '', maxDays: '1', isMandatory: true }]);
    const [loading, setLoading] = useState(false);
    const { createPlan, getPlans } = useAuth();

    useEffect(() => {
        if (isEdit) {
            // For now we fetch all and find, but ideally there is getPlanById
            const fetchPlan = async () => {
                try {
                    const plans = await getPlans();
                    const plan = plans.find(p => p._id === planId);
                    if (plan) {
                        setName(plan.name);
                        setDescription(plan.description);
                        setMaxDays(plan.maxDays?.toString() || '7');
                        setSubtasks(plan.subtasks);
                    }
                } catch (error) {
                    Alert.alert('Error', 'Failed to load plan');
                }
            };
            fetchPlan();
        }
    }, [isEdit, planId, getPlans]);

    const addSubtask = () => {
        setSubtasks([...subtasks, { title: '', maxDays: '1', isMandatory: true }]);
    };

    const removeSubtask = (index) => {
        if (subtasks.length === 1) return;
        const newSubtasks = [...subtasks];
        newSubtasks.splice(index, 1);
        setSubtasks(newSubtasks);
    };

    const updateSubtaskText = (text, index) => {
        const newSubtasks = [...subtasks];
        newSubtasks[index].title = text;
        setSubtasks(newSubtasks);
    };

    const updateSubtaskMaxDays = (days, index) => {
        const newSubtasks = [...subtasks];
        newSubtasks[index].maxDays = days;
        setSubtasks(newSubtasks);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a plan name');
            return;
        }

        const filteredSubtasks = subtasks.filter(s => s.title.trim() !== '');
        if (filteredSubtasks.length === 0) {
            Alert.alert('Error', 'Please add at least one subtask');
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                // Implement updatePlan in AuthContext if needed
                Alert.alert('Info', 'Update not fully implemented yet');
            } else {
                const formattedSubtasks = filteredSubtasks.map(s => ({
                    title: s.title,
                    maxDays: parseInt(s.maxDays) || 1,
                    isMandatory: s.isMandatory
                }));
                await createPlan({ name, description, maxDays: parseInt(maxDays) || 7, subtasks: formattedSubtasks });
                Alert.alert('Success', 'Plan created successfully');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>{isEdit ? 'Edit Plan' : 'New Plan'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Surface style={styles.surface} elevation={2}>
                    <TextInput
                        style={styles.input}
                        placeholder="Plan Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Description (Optional)"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={styles.inputLabel}>Maximum Days to Complete</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="7"
                        value={maxDays}
                        onChangeText={setMaxDays}
                        keyboardType="numeric"
                    />

                    <View style={styles.subtasksHeader}>
                        <Text style={styles.sectionTitle}>Subtasks</Text>
                        <Button icon="plus" mode="text" onPress={addSubtask}>Add</Button>
                    </View>

                    {subtasks.map((subtask, index) => (
                        <View key={index} style={styles.subtaskContainer}>
                            <View style={styles.subtaskRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    placeholder={`Subtask ${index + 1}`}
                                    value={subtask.title}
                                    onChangeText={(text) => updateSubtaskText(text, index)}
                                />
                                <IconButton
                                    icon="delete"
                                    iconColor="#FF5252"
                                    onPress={() => removeSubtask(index)}
                                    disabled={subtasks.length === 1}
                                />
                            </View>
                            <View style={styles.daysRow}>
                                <Text style={styles.daysLabel}>Days:</Text>
                                <TextInput
                                    style={styles.daysInput}
                                    placeholder="1"
                                    value={subtask.maxDays?.toString() || '1'}
                                    onChangeText={(text) => updateSubtaskMaxDays(text, index)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    ))}

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={loading}
                        disabled={loading}
                        style={styles.saveButton}
                    >
                        {isEdit ? 'Update Plan' : 'Save Plan'}
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
        paddingHorizontal: 10,
        paddingBottom: 10,
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
        backgroundColor: 'white',
    },
    input: {
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 15,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    subtasksHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    subtaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subtaskContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    daysRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginLeft: 10,
    },
    daysLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    daysInput: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        width: 60,
        textAlign: 'center',
        fontSize: 14,
    },
    saveButton: {
        marginTop: 20,
        borderRadius: 10,
    },
});

export default EditPlanScreen;
