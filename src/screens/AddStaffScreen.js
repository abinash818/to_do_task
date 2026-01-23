import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated, StatusBar } from 'react-native';
import { Button, Surface, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-native';

const AddStaffScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('staff');
    const [loading, setLoading] = useState(false);
    const { registerStaff } = useAuth();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
        ]).start();
    }, []);

    const handleCreateStaff = async () => {
        if (!username || !password || !name) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            await registerStaff({
                username,
                password,
                name,
                role
            });

            Alert.alert('Success', `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!`);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Creation Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

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
                <View style={styles.headerContent}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#fff"
                        onPress={() => navigation.goBack()}
                    />
                    <Text style={styles.headerTitle}>Add New Staff</Text>
                    <View style={{ width: 48 }} />
                </View>
                <Text style={styles.headerSubtitle}>Create a new staff account</Text>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }}>
                        <Surface style={styles.surface} elevation={3}>
                            <View style={styles.formIcon}>
                                <Text style={styles.formEmoji}>👤</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputIcon}>📝</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter staff name"
                                        placeholderTextColor="#aaa"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>

                                <Text style={styles.inputLabel}>User ID</Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputIcon}>🆔</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter username"
                                        placeholderTextColor="#aaa"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>

                                <Text style={styles.inputLabel}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputIcon}>🔒</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter password"
                                        placeholderTextColor="#aaa"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>

                                <Text style={styles.inputLabel}>Role</Text>
                                <View style={styles.roleContainer}>
                                    <TouchableOpacity
                                        style={[styles.roleChip, role === 'staff' && styles.selectedRoleChip]}
                                        onPress={() => setRole('staff')}
                                    >
                                        <Text style={[styles.roleText, role === 'staff' && styles.selectedRoleText]}>Staff</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.roleChip, role === 'manager' && styles.selectedRoleChip]}
                                        onPress={() => setRole('manager')}
                                    >
                                        <Text style={[styles.roleText, role === 'manager' && styles.selectedRoleText]}>Manager</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Button
                                mode="contained"
                                onPress={handleCreateStaff}
                                loading={loading}
                                disabled={loading}
                                style={styles.button}
                                contentStyle={styles.buttonContent}
                                buttonColor="#8b5cf6"
                            >
                                {loading ? 'Creating...' : 'Create Staff Account'}
                            </Button>
                        </Surface>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingBottom: 30,
        paddingHorizontal: 10,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerContent: {
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 25,
    },
    surface: {
        padding: 25,
        borderRadius: 20,
        backgroundColor: 'white',
    },
    formIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f3e8ff',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
    },
    formEmoji: {
        fontSize: 28,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 18,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    inputIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    button: {
        width: '100%',
        borderRadius: 12,
        marginTop: 10,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    roleChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectedRoleChip: {
        backgroundColor: '#8b5cf6',
        borderColor: '#8b5cf6',
    },
    roleText: {
        color: '#666',
        fontWeight: 'bold',
    },
    selectedRoleText: {
        color: '#fff',
    },
});

export default AddStaffScreen;
