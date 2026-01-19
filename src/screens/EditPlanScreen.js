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
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(false);
    const { createPlan, getPlans, token } = useAuth();

    // Add missing API update methods to AuthContext manually if they don't exist, 
    // but for now we'll assume they need to be called here or AuthContext needs update.
    // Given the previous code, we'll stick to using the payload correctly.
    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        if (isEdit) {
            const fetchPlan = async () => {
                try {
                    const plans = await getPlans();
                    const plan = plans.find(p => p._id === planId);
                    if (plan) {
                        setName(plan.name);
                        setDescription(plan.description);
                        setMaxDays(plan.maxDays?.toString() || '7');
                        setSubtasks(plan.subtasks);
                        setVariants(plan.variants || []);
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

    // Variant Handlers
    const addVariant = () => {
        setVariants([...variants, { name: '', duration: '', subtasks: [] }]);
    };

    const removeVariant = (index) => {
        const newVariants = [...variants];
        newVariants.splice(index, 1);
        setVariants(newVariants);
    };

    const updateVariantName = (text, index) => {
        const newVariants = [...variants];
        newVariants[index].name = text;
        setVariants(newVariants);
    };

    const updateVariantDuration = (text, index) => {
        const newVariants = [...variants];
        newVariants[index].duration = text;
        setVariants(newVariants);
    };

    // Subtask Handlers for Variants
    const addVariantSubtask = (variantIndex) => {
        const newVariants = [...variants];
        if (!newVariants[variantIndex].subtasks) {
            newVariants[variantIndex].subtasks = [];
        }
        newVariants[variantIndex].subtasks.push({ title: '', maxDays: '1', isMandatory: true });
        setVariants(newVariants);
    };

    const removeVariantSubtask = (variantIndex, subtaskIndex) => {
        const newVariants = [...variants];
        newVariants[variantIndex].subtasks.splice(subtaskIndex, 1);
        setVariants(newVariants);
    };

    const updateVariantSubtaskTitle = (text, variantIndex, subtaskIndex) => {
        const newVariants = [...variants];
        newVariants[variantIndex].subtasks[subtaskIndex].title = text;
        setVariants(newVariants);
    };

    const updateVariantSubtaskMaxDays = (text, variantIndex, subtaskIndex) => {
        const newVariants = [...variants];
        newVariants[variantIndex].subtasks[subtaskIndex].maxDays = text;
        setVariants(newVariants);
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
            const payload = {
                name,
                description,
                maxDays: parseInt(maxDays) || 7,
                subtasks: filteredSubtasks.map(s => ({
                    title: s.title,
                    maxDays: parseInt(s.maxDays) || 1,
                    isMandatory: s.isMandatory
                })),
                variants: variants.filter(v => v.name.trim() !== '').map(v => ({
                    name: v.name,
                    duration: parseInt(v.duration) || 1,
                    subtasks: v.subtasks ? v.subtasks.filter(s => s.title.trim() !== '').map(s => ({
                        title: s.title,
                        maxDays: parseInt(s.maxDays) || 1,
                        isMandatory: s.isMandatory
                    })) : []
                }))
            };

            if (isEdit) {
                const response = await fetch(`${API_URL}/plans/${planId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Failed to update plan');

                Alert.alert('Success', 'Plan updated successfully');
            } else {
                await createPlan(payload);
                Alert.alert('Success', 'Plan created successfully');
            }
            navigation.goBack();
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

                    {/* Variants Section */}
                    <View style={styles.subtasksHeader}>
                        <Text style={styles.sectionTitle}>Plan Variants (Optional)</Text>
                        <Button icon="plus" mode="text" onPress={addVariant}>Add</Button>
                    </View>

                    {variants.map((variant, index) => (
                        <View key={index} style={styles.subtaskContainer}>
                            <View style={styles.subtaskRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    placeholder="Variant Name (e.g., Self, Online)"
                                    value={variant.name}
                                    onChangeText={(text) => updateVariantName(text, index)}
                                />
                                <IconButton icon="delete" iconColor="#FF5252" onPress={() => removeVariant(index)} />
                            </View>
                            <View style={styles.daysRow}>
                                <Text style={styles.daysLabel}>Duration (Days):</Text>
                                <TextInput
                                    style={styles.daysInput}
                                    placeholder="5"
                                    value={variant.duration?.toString()}
                                    onChangeText={(text) => updateVariantDuration(text, index)}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Variant Subtasks */}
                            <Text style={[styles.inputLabel, { fontSize: 13, color: '#666', marginTop: 10, marginLeft: 5 }]}>Variant Subtasks:</Text>
                            {variant.subtasks && variant.subtasks.map((vSubtask, vSubIndex) => (
                                <View key={vSubIndex} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, marginLeft: 10 }}>
                                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#666', marginRight: 8 }} />
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0, paddingVertical: 8, height: 40, marginRight: 5 }]}
                                        placeholder="Step title"
                                        value={vSubtask.title}
                                        onChangeText={(text) => updateVariantSubtaskTitle(text, index, vSubIndex)}
                                    />
                                    <TextInput
                                        style={[styles.daysInput, { width: 50, height: 40, marginRight: 5 }]}
                                        placeholder="Days"
                                        value={vSubtask.maxDays?.toString()}
                                        onChangeText={(text) => updateVariantSubtaskMaxDays(text, index, vSubIndex)}
                                        keyboardType="numeric"
                                    />
                                    <IconButton icon="close" size={16} onPress={() => removeVariantSubtask(index, vSubIndex)} />
                                </View>
                            ))}
                            <Button compact mode="text" onPress={() => addVariantSubtask(index)}>+ Add Step</Button>
                        </View>
                    ))}

                    <Divider style={{ marginVertical: 15 }} />

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
