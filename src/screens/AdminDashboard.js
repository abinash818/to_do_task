import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Animated, Dimensions, StatusBar } from 'react-native';
import { Button, Card, Title, Paragraph, Surface, IconButton, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
    const { logout, user, getTasks, getPlans, getStaff } = useAuth();
    const [stats, setStats] = useState({ tasks: 0, plans: 0, staff: 0, pending: 0 });

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true })
        ]).start();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const fetchStats = async () => {
                try {
                    const [tasks, plans, staff] = await Promise.all([
                        getTasks().catch(() => []),
                        getPlans().catch(() => []),
                        getStaff().catch(() => [])
                    ]);
                    setStats({
                        tasks: tasks.length,
                        plans: plans.length,
                        staff: staff.length,
                        pending: tasks.filter(t => t.status === 'pending').length
                    });
                } catch (error) {
                    console.error('Failed to fetch stats:', error);
                }
            };
            fetchStats();
        }, [getTasks, getPlans, getStaff])
    );

    const ActionButton = ({ icon, label, color, onPress }) => (
        <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                colors={color}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
            >
                <Text style={styles.actionIcon}>{icon}</Text>
                <Text style={styles.actionLabel}>{label}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    const StatCard = ({ icon, value, label, color, onPress }) => (
        <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
            <Surface style={styles.statCard} elevation={2}>
                <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                    <Text style={styles.statIcon}>{icon}</Text>
                </View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </Surface>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <Animated.View style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <StatCard icon="📋" value={stats.tasks} label="Total Tasks" color="#667eea" />
                    <StatCard icon="⏳" value={stats.pending} label="Pending" color="#f59e0b" />
                    <StatCard icon="📁" value={stats.plans} label="Plans" color="#10b981" onPress={() => navigation.navigate('ManagePlans')} />
                    <StatCard icon="👥" value={stats.staff} label="Staff" color="#8b5cf6" onPress={() => navigation.navigate('ManageStaff')} />
                </Animated.View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Quick Actions */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <ActionButton
                            icon="📝"
                            label="Assign Task"
                            color={['#667eea', '#764ba2']}
                            onPress={() => navigation.navigate('AssignTask')}
                        />
                        <ActionButton
                            icon="📁"
                            label="Manage Plans"
                            color={['#10b981', '#059669']}
                            onPress={() => navigation.navigate('ManagePlans')}
                        />
                        <ActionButton
                            icon="👤"
                            label="Add Staff"
                            color={['#8b5cf6', '#7c3aed']}
                            onPress={() => navigation.navigate('AddStaff')}
                        />
                        <ActionButton
                            icon="📊"
                            label="View Reports"
                            color={['#f59e0b', '#d97706']}
                            onPress={() => navigation.navigate('Reports')}
                        />
                    </View>
                </Animated.View>

                {/* Recent Activity Card */}
                <Card style={styles.activityCard}>
                    <Card.Content>
                        <Title style={styles.cardTitle}>📈 Dashboard Overview</Title>
                        <Paragraph style={styles.cardDescription}>
                            You have {stats.pending} pending tasks and {stats.staff} active staff members.
                            Use the quick actions above to manage your team efficiently.
                        </Paragraph>
                    </Card.Content>
                </Card>
            </ScrollView>
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
        paddingBottom: 100,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 25,
        marginHorizontal: -5,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 5,
        padding: 12,
        borderRadius: 15,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statIcon: {
        fontSize: 18,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    content: {
        flex: 1,
        marginTop: -50,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginTop: 20,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: (width - 60) / 2,
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    actionGradient: {
        paddingVertical: 25,
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    actionIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    activityCard: {
        borderRadius: 15,
        marginTop: 10,
        backgroundColor: '#fff',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardDescription: {
        color: '#666',
        lineHeight: 22,
    },
});

export default AdminDashboard;
