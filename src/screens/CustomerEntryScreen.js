import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Button, Surface, IconButton, ActivityIndicator, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const CustomerEntryScreen = ({ navigation }) => {
    // Customer Details
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');

    // Plan & Task Details
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedSubPlan, setSelectedSubPlan] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Financials
    const [totalAmount, setTotalAmount] = useState('');
    const [paidAmount, setPaidAmount] = useState('');

    // Valuation Specifics
    const [branchName, setBranchName] = useState('');
    const [customBankName, setCustomBankName] = useState('');

    // Assignment
    const [selectedStaff, setSelectedStaff] = useState(null);

    // Data & State
    const [staffList, setStaffList] = useState([]);
    const [planList, setPlanList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { getPlans, assignTask, getStaff } = useAuth();

    const buildingSubPlans = [
        { label: 'Self', days: 5 },
        { label: 'Online', days: 7 },
        { label: 'High raised', days: 20 },
        { label: 'Non High raised', days: 15 },
    ];

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
        setSelectedSubPlan(null); // Reset sub-plan

        // If no variants, auto-set deadline
        if ((!plan.variants || plan.variants.length === 0) && plan.maxDays) {
            const autoDeadline = new Date();
            autoDeadline.setDate(autoDeadline.getDate() + plan.maxDays);
            setDeadline(autoDeadline);
        }
    };

    const handleSelectSubPlan = (subPlan) => {
        setSelectedSubPlan(subPlan);
        const autoDeadline = new Date();
        autoDeadline.setDate(autoDeadline.getDate() + subPlan.duration);
        setDeadline(autoDeadline);
    };

    const handleCreateJob = async () => {
        if (!name || !mobile || !title || !selectedStaff || !deadline) {
            Alert.alert('Error', 'Please fill in all required fields (Name, Mobile, Task Title, Staff, Deadline)');
            return;
        }

        const hasVariants = selectedPlan?.variants && selectedPlan.variants.length > 0;
        if (hasVariants && !selectedSubPlan) {
            Alert.alert('Error', 'Please select a plan subtype');
            return;
        }

        setSaving(true);
        try {
            // Prepare subtasks
            // If sub-plan (Variant) is selected AND has subtasks, use them.
            // Otherwise use default plan subtasks.
            let subtasksToUse = [];
            if (selectedSubPlan && selectedSubPlan.subtasks && selectedSubPlan.subtasks.length > 0) {
                subtasksToUse = selectedSubPlan.subtasks.map(s => ({ title: s.title, completed: false }));
            } else if (selectedPlan) {
                subtasksToUse = selectedPlan.subtasks.map(s => ({ title: s.title, completed: false }));
            } else {
                subtasksToUse = [{ title: 'Initial Task', completed: false }];
            }

            const isValuation = selectedPlan?.name?.toUpperCase() === 'VALUATION WORK';
            let finalValuationDetails = null;

            if (isValuation) {
                if (!branchName) {
                    Alert.alert('Error', 'Please enter Branch Name');
                    setSaving(false);
                    return;
                }
                const bank = selectedSubPlan?.name === 'Other' ? customBankName : selectedSubPlan?.name;
                if (!bank) {
                    Alert.alert('Error', 'Please specify Bank Name');
                    setSaving(false);
                    return;
                }
                finalValuationDetails = {
                    bank,
                    branch: branchName
                };
            }

            const payload = {
                title: hasVariants ? `${title} - ${selectedSubPlan.name}` : title,
                description,
                assignedTo: selectedStaff._id,
                planId: selectedPlan?._id,
                subtasks: subtasksToUse,
                deadline: deadline.toISOString(),
                customerDetails: {
                    name,
                    address,
                    mobile,
                    email
                },
                paymentDetails: {
                    totalAmount: parseFloat(totalAmount) || 0,
                    paidAmount: parseFloat(paidAmount) || 0
                },
                valuationDetails: finalValuationDetails
            };

            await assignTask(payload);
            Alert.alert('Success', 'Job created successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Job creation error:', error);
            Alert.alert('Error', 'Failed to create job');
        } finally {
            setSaving(false);
        }
    };

    const pendingAmount = (parseFloat(totalAmount) || 0) - (parseFloat(paidAmount) || 0);

    const isBuildingPlan = selectedPlan?.name?.toLowerCase().includes('building plan');

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>New Customer Job</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. Customer Details */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionHeader}>👤 Customer Details</Text>
                    <TextInput style={styles.input} placeholder="Customer Name *" value={name} onChangeText={setName} />
                    <TextInput style={styles.input} placeholder="Mobile Number *" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
                    <TextInput style={[styles.input, styles.textArea]} placeholder="Address" value={address} onChangeText={setAddress} multiline />
                    <TextInput style={styles.input} placeholder="Email (Optional)" value={email} onChangeText={setEmail} keyboardType="email-address" />
                </Surface>

                {/* 2. Plan Selection */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionHeader}>📋 Select Plan / Service</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        <TouchableOpacity
                            style={[styles.chip, !selectedPlan && styles.selectedChip]}
                            onPress={() => { setSelectedPlan(null); setTitle(''); setDescription(''); }}
                        >
                            <Text style={!selectedPlan ? styles.selectedChipText : {}}>Custom</Text>
                        </TouchableOpacity>
                        {planList.map(plan => (
                            <TouchableOpacity
                                key={plan._id}
                                style={[styles.chip, selectedPlan?._id === plan._id && styles.selectedChip]}
                                onPress={() => handleSelectPlan(plan)}
                            >
                                <Text style={selectedPlan?._id === plan._id ? styles.selectedChipText : {}}>{plan.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Sub-Plans for Building Plan/Variants */}
                    {selectedPlan?.variants && selectedPlan.variants.length > 0 && (
                        <View style={styles.subPlanContainer}>
                            <Text style={styles.subPlanTitle}>
                                {selectedPlan?.name?.toUpperCase() === 'VALUATION WORK' ? 'Select Bank:' : 'Select Type:'}
                            </Text>
                            <View style={styles.subPlanGrid}>
                                {selectedPlan.variants.map((variant, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.subPlanChip, selectedSubPlan?.name === variant.name && styles.selectedSubPlanChip]}
                                        onPress={() => handleSelectSubPlan(variant)}
                                    >
                                        <Text style={[styles.subPlanText, selectedSubPlan?.name === variant.name && styles.selectedLinkText]}>
                                            {variant.name} ({variant.duration}d)
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Valuation Specific Inputs */}
                    {selectedPlan?.name?.toUpperCase() === 'VALUATION WORK' && (
                        <View style={styles.valuationContainer}>
                            <Text style={styles.subPlanTitle}>Valuation Details:</Text>

                            {selectedSubPlan?.name === 'Other' && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Custom Bank Name *"
                                    value={customBankName}
                                    onChangeText={setCustomBankName}
                                />
                            )}

                            <TextInput
                                style={styles.input}
                                placeholder="Branch Name *"
                                value={branchName}
                                onChangeText={setBranchName}
                            />
                        </View>
                    )}

                    <TextInput style={styles.input} placeholder="Task Title *" value={title} onChangeText={setTitle} />

                    {/* Deadline Info */}
                    {selectedSubPlan ? (
                        <Text style={styles.infoText}>⏱ Deadline set to {selectedSubPlan.duration} days ({selectedSubPlan.name})</Text>
                    ) : selectedPlan?.maxDays && (!selectedPlan.variants || selectedPlan.variants.length === 0) ? (
                        <Text style={styles.infoText}>⏱ Deadline auto-set to {selectedPlan.maxDays} days from now</Text>
                    ) : null}

                </Surface>

                {/* 3. Financials */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionHeader}>💰 Financials</Text>
                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.halfInput]}
                            placeholder="Total Amount"
                            value={totalAmount}
                            onChangeText={setTotalAmount}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={[styles.input, styles.halfInput]}
                            placeholder="Received Amount"
                            value={paidAmount}
                            onChangeText={setPaidAmount}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Pending Balance:</Text>
                        <Text style={[styles.balanceValue, { color: pendingAmount > 0 ? '#d32f2f' : '#388e3c' }]}>
                            ₹ {pendingAmount.toFixed(2)}
                        </Text>
                    </View>
                </Surface>

                {/* 4. Assignment */}
                <Surface style={styles.section} elevation={1}>
                    <Text style={styles.sectionHeader}>👷 Assign Staff</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {staffList.map(staff => (
                            <TouchableOpacity
                                key={staff._id}
                                style={[styles.chip, selectedStaff?._id === staff._id && styles.selectedChip]}
                                onPress={() => setSelectedStaff(staff)}
                            >
                                <Text style={selectedStaff?._id === staff._id ? styles.selectedChipText : {}}>{staff.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Surface>

                <Button
                    mode="contained"
                    onPress={handleCreateJob}
                    loading={saving}
                    disabled={saving || loading}
                    style={styles.submitButton}
                    contentStyle={{ paddingVertical: 8 }}
                >
                    Create Job
                </Button>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 40, paddingBottom: 10, paddingHorizontal: 10, backgroundColor: '#fff', elevation: 2 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
    scrollContent: { padding: 15 },
    section: { padding: 15, borderRadius: 12, backgroundColor: '#fff', marginBottom: 20 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    input: { backgroundColor: '#f1f3f4', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', marginBottom: 12 },
    textArea: { height: 80, textAlignVertical: 'top' },
    horizontalScroll: { marginBottom: 15 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee', marginRight: 10 },
    selectedChip: { backgroundColor: '#2196F3' },
    selectedChipText: { color: '#fff', fontWeight: 'bold' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfInput: { width: '48%' },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    balanceLabel: { fontSize: 16, fontWeight: 'bold' },
    balanceValue: { fontSize: 18, fontWeight: 'bold' },
    submitButton: { borderRadius: 8, marginTop: 10, backgroundColor: '#2196F3' },
    infoText: { fontSize: 12, color: '#666', marginBottom: 10, fontStyle: 'italic' },
    subPlanContainer: { marginTop: 10, marginBottom: 15, padding: 10, backgroundColor: '#f8f9fa', borderRadius: 8 },
    subPlanTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#444' },
    subPlanGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    subPlanChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#e0e0e0', marginRight: 8, marginBottom: 8 },
    selectedSubPlanChip: { backgroundColor: '#667eea' },
    subPlanText: { fontSize: 13, color: '#333' },
    selectedLinkText: { color: '#fff', fontWeight: 'bold' },
    valuationContainer: { marginTop: 10, padding: 10, backgroundColor: '#e3f2fd', borderRadius: 8, marginBottom: 15 }
});

export default CustomerEntryScreen;
