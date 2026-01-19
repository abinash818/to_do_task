import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Dimensions,
    StatusBar,
    ScrollView
} from 'react-native';
import { Button, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-native';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!userId || !password) {
            Alert.alert('Error', 'Please enter User ID and password');
            return;
        }

        setLoading(true);
        try {
            await login(userId, password);
            console.log('Logged in successfully');
        } catch (error) {
            console.error('Login Error:', error);
            if (Platform.OS === 'web') alert(error.message);
            else Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Decorative circles */}
                <Animated.View style={[styles.circle, styles.circle1, { opacity: fadeAnim }]} />
                <Animated.View style={[styles.circle, styles.circle2, { opacity: fadeAnim }]} />
                <Animated.View style={[styles.circle, styles.circle3, { opacity: fadeAnim }]} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.content}
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
                        {/* Logo/Branding */}
                        <Animated.View style={[styles.brandingContainer, {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }]}>
                            <View style={styles.logoCircle}>
                                <Text style={styles.logoText}>✓</Text>
                            </View>
                            <Text style={styles.appName}>TaskFlow</Text>
                            <Text style={styles.tagline}>Manage • Assign • Complete</Text>
                        </Animated.View>

                        {/* Login Card */}
                        <Animated.View style={{
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }}>
                            <Surface style={styles.surface} elevation={5}>
                                <Text style={styles.title}>Welcome Back</Text>
                                <Text style={styles.subtitle}>Sign in with your User ID</Text>

                                <View style={styles.inputContainer}>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputIcon}>👤</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="User ID"
                                            placeholderTextColor="#aaa"
                                            value={userId}
                                            onChangeText={setUserId}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputIcon}>🔒</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Password"
                                            placeholderTextColor="#aaa"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>
                                </View>

                                <Button
                                    mode="contained"
                                    onPress={handleLogin}
                                    loading={loading}
                                    disabled={loading}
                                    style={styles.button}
                                    contentStyle={styles.buttonContent}
                                    buttonColor="#667eea"
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>

                                <Text style={styles.footerText}>
                                    Contact your administrator for account access
                                </Text>
                            </Surface>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    circle1: {
        width: 200,
        height: 200,
        top: -50,
        right: -50,
    },
    circle2: {
        width: 150,
        height: 150,
        bottom: 100,
        left: -30,
    },
    circle3: {
        width: 80,
        height: 80,
        top: height * 0.3,
        right: 20,
    },
    brandingContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    logoText: {
        fontSize: 36,
        color: '#fff',
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
        letterSpacing: 2,
    },
    surface: {
        padding: 30,
        borderRadius: 25,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 25,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    inputIcon: {
        fontSize: 18,
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
    footerText: {
        marginTop: 20,
        fontSize: 12,
        color: '#aaa',
        textAlign: 'center',
    },
});

export default LoginScreen;
