import React, { useState, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    TextInput, Alert, StatusBar, Modal
} from 'react-native';
import { Card, IconButton, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

const ManageStaffScreen = ({ navigation }) => {
    const { getStaff, token } = useAuth();
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const API_URL = 'http://localhost:5000/api';

    useFocusEffect(
        useCallback(() => {
            fetchStaff();
        }, [])
    );

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const data = await getStaff();
            setStaffList(data);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            Alert.alert('Error', 'Failed to load staff list');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (staff) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete ${staff.name}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_URL}/users/${staff._id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });

                            if (response.ok) {
                                Alert.alert('Success', 'Staff member deleted');
                                fetchStaff(); // Refresh list
                            } else {
                                const data = await response.json();
                                Alert.alert('Error', data.message || 'Failed to delete staff');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete staff member');
                        }
                    }
                }
            ]
        );
    };

    const generatePassword = () => {
        const length = 12;
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '@#$%&*!';

        const allChars = uppercase + lowercase + numbers + symbols;

        // Ensure at least one of each type
        let password = '';
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];

        // Fill the rest
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password
        password = password.split('').sort(() => Math.random() - 0.5).join('');

        setNewPassword(password);
        setCopied(false);
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(newPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setResetting(true);
        try {
            const response = await fetch(`${API_URL}/users/${selectedStaff._id}/reset-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            Alert.alert('Success', `Password reset for ${selectedStaff.name}`);
            setSelectedStaff(null);
            setNewPassword('');
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setResetting(false);
        }
    };

    const getPasswordStrength = (pwd) => {
        if (!pwd) return { label: '', color: '#ccc' };
        if (pwd.length < 6) return { label: 'Too Short', color: '#ef4444' };

        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score < 3) return { label: 'Weak', color: '#ef4444' };
        if (score < 5) return { label: 'Medium', color: '#f59e0b' };
        return { label: 'Strong', color: '#10b981' };
    };

    const strength = getPasswordStrength(newPassword);

    const filteredStaff = staffList.filter(staff =>
        staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <IconButton icon="arrow-left" iconColor="#fff" onPress={() => navigation.goBack()} />
                    <Text style={styles.headerTitle}>Manage Staff</Text>
                    <IconButton
                        icon="plus"
                        iconColor="#fff"
                        onPress={() => navigation.navigate('AddStaff')}
                    />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search staff name..."
                        placeholderTextColor="#ccc"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <IconButton icon="magnify" iconColor="#fff" size={20} style={styles.searchIcon} />
                </View>

                <Text style={styles.headerSubtitle}>{filteredStaff.length} staff members</Text>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {filteredStaff.map((staff, index) => (
                    <Card key={staff._id || index} style={styles.staffCard}>
                        <Card.Content style={styles.staffContent}>
                            <View style={styles.staffInfo}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {staff.name?.charAt(0)?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                                <View style={styles.staffDetails}>
                                    <Text style={styles.staffName}>{staff.name}</Text>
                                    <Text style={styles.staffUsername}>@{staff.username}</Text>
                                </View>
                            </View>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={() => {
                                        setSelectedStaff(staff);
                                        setNewPassword('');
                                        setCopied(false);
                                    }}
                                >
                                    <Text style={styles.resetButtonText}>🔐 Reset</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(staff)}
                                >
                                    <IconButton icon="delete" iconColor="#ef4444" size={20} style={{ margin: 0 }} />
                                </TouchableOpacity>
                            </View>
                        </Card.Content>
                    </Card>
                ))}

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Password Reset Modal */}
            <Modal
                visible={!!selectedStaff}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedStaff(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>🔐 Reset Password</Text>
                            <IconButton icon="close" onPress={() => setSelectedStaff(null)} />
                        </View>

                        {selectedStaff && (
                            <>
                                <Text style={styles.modalStaffName}>
                                    {selectedStaff.name} (@{selectedStaff.username})
                                </Text>

                                <View style={styles.passwordSection}>
                                    <Text style={styles.inputLabel}>New Password</Text>
                                    <View style={styles.passwordRow}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            value={newPassword}
                                            onChangeText={(text) => {
                                                setNewPassword(text);
                                                setCopied(false);
                                            }}
                                            placeholder="Enter new password"
                                            secureTextEntry={false}
                                        />
                                        <TouchableOpacity
                                            style={styles.copyButton}
                                            onPress={copyToClipboard}
                                            disabled={!newPassword}
                                        >
                                            <Text style={styles.copyButtonText}>
                                                {copied ? '✅' : '📋'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {newPassword ? (
                                        <View style={styles.strengthRow}>
                                            <View style={[styles.strengthBar, { backgroundColor: strength.color }]} />
                                            <Text style={[styles.strengthText, { color: strength.color }]}>
                                                {strength.label}
                                            </Text>
                                        </View>
                                    ) : null}

                                    <TouchableOpacity
                                        style={styles.generateButton}
                                        onPress={generatePassword}
                                    >
                                        <Text style={styles.generateButtonText}>
                                            🎲 Generate Strong Password
                                        </Text>
                                    </TouchableOpacity>

                                    <Text style={styles.tipText}>
                                        💡 Tip: Use generated password for maximum security
                                    </Text>
                                </View>

                                <View style={styles.modalActions}>
                                    <Button
                                        mode="outlined"
                                        onPress={() => setSelectedStaff(null)}
                                        style={styles.cancelButton}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        mode="contained"
                                        onPress={resetPassword}
                                        loading={resetting}
                                        disabled={resetting || !newPassword}
                                        style={styles.saveButton}
                                        buttonColor="#8b5cf6"
                                    >
                                        Reset Password
                                    </Button>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 25,
        paddingHorizontal: 10,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    content: {
        flex: 1,
        padding: 15,
    },
    staffCard: {
        marginBottom: 12,
        borderRadius: 15,
        backgroundColor: '#fff',
    },
    staffContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    staffInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    staffDetails: {
        flex: 1,
    },
    staffName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    staffUsername: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    resetButton: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    resetButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d97706',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalStaffName: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    passwordSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        fontSize: 16,
    },
    copyButton: {
        marginLeft: 10,
        padding: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
    },
    copyButtonText: {
        fontSize: 18,
    },
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    strengthBar: {
        width: 60,
        height: 4,
        borderRadius: 2,
        marginRight: 10,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
    },
    generateButton: {
        backgroundColor: '#ede9fe',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    generateButtonText: {
        color: '#7c3aed',
        fontWeight: '600',
        fontSize: 14,
    },
    tipText: {
        fontSize: 12,
        color: '#888',
        marginTop: 15,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelButton: {
        flex: 1,
        marginRight: 10,
        borderRadius: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        marginHorizontal: 15,
        marginTop: 10,
        paddingHorizontal: 15,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        height: 40,
    },
    searchIcon: {
        margin: 0,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        marginLeft: 10,
    },
    saveButton: {
        flex: 1,
        marginLeft: 10,
        borderRadius: 10,
    },
});

export default ManageStaffScreen;
