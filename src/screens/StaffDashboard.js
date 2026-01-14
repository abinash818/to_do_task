import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Animated, Dimensions, StatusBar } from 'react-native';
import { Button, Card, Title, Paragraph, Chip, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const StaffDashboard = ({ navigation }) => {
    const { logout, user, getTasks } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [getTasks]);

    useFocusEffect(
        useCallback(() => {
            fetchTasks();
        }, [fetchTasks])
    );

    const getProgress = (subtasks) => {
        if (!subtasks || subtasks.length === 0) return 0;
        return subtasks.filter(s => s.completed).length / subtasks.length;
    };

    const getProgressColor = (progress) => {
        if (progress >= 1) return ['#10b981', '#059669'];
        if (progress > 0.5) return ['#f59e0b', '#d97706'];
        return ['#ef4444', '#dc2626'];
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed':
                return { bg: '#d1fae5', color: '#059669', emoji: '✅' };
            case 'processing':
                return { bg: '#dbeafe', color: '#2563eb', emoji: '⚙️' };
            case 'overdue':
                return { bg: '#fee2e2', color: '#dc2626', emoji: '⚠️' };
            default: // pending
                return { bg: '#fef3c7', color: '#d97706', emoji: '📋' };
        }
    };

    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const processingCount = tasks.filter(t => t.status === 'processing').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const overdueCount = tasks.filter(t => t.status === 'overdue').length;

    const renderTaskItem = ({ item, index }) => {
        const progress = getProgress(item.subtasks);
        const progressColors = getProgressColor(progress);
        const completedSubtasks = item.subtasks.filter(s => s.completed).length;
        const statusStyle = getStatusStyle(item.status);

        return (
            <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20 * (index + 1), 0] }) }]
            }}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
                >
                    <Card style={styles.taskCard}>
                        <Card.Content>
                            <View style={styles.taskHeader}>
                                <View style={styles.taskTitleRow}>
                                    <Text style={styles.taskEmoji}>
                                        {statusStyle.emoji}
                                    </Text>
                                    <Title style={styles.taskTitle}>{item.title}</Title>
                                </View>
                                <Chip
                                    mode="flat"
                                    style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}
                                    textStyle={{ color: statusStyle.color, fontSize: 11 }}
                                >
                                    {item.status.toUpperCase()}
                                </Chip>
                            </View>

                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>📅 Due: {new Date(item.deadline).toLocaleDateString()}</Text>
                            </View>

                            {/* Progress Section */}
                            <View style={styles.progressSection}>
                                <View style={styles.progressHeader}>
                                    <Text style={styles.progressLabel}>Progress</Text>
                                    <Text style={styles.progressValue}>{completedSubtasks}/{item.subtasks.length}</Text>
                                </View>
                                <View style={styles.progressBarContainer}>
                                    <LinearGradient
                                        colors={progressColors}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                                    />
                                </View>
                            </View>
                        </Card.Content>
                        <Card.Actions style={styles.cardActions}>
                            <Button
                                mode="text"
                                compact
                                onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
                                labelStyle={styles.updateButtonLabel}
                            >
                                Update Progress →
                            </Button>
                        </Card.Actions>
                    </Card>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Hello,</Text>
                        <Text style={styles.userName}>{user?.name || 'Staff'}</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Summary */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{pendingCount}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{completedCount}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{tasks.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Tasks List */}
            <View style={styles.content}>
                <Text style={styles.sectionTitle}>My Tasks</Text>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#8b5cf6" />
                    </View>
                ) : (
                    <FlatList
                        data={tasks}
                        keyExtractor={(item) => item._id}
                        renderItem={renderTaskItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyEmoji}>🎉</Text>
                                <Text style={styles.emptyTitle}>All caught up!</Text>
                                <Text style={styles.emptyText}>No tasks assigned yet.</Text>
                            </View>
                        }
                    />
                )}
            </View>
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
        justifyContent: 'space-around',
        marginTop: 25,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 15,
        paddingVertical: 15,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    listContent: {
        paddingBottom: 20,
    },
    taskCard: {
        marginBottom: 15,
        borderRadius: 16,
        backgroundColor: '#fff',
        elevation: 2,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    taskTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    taskEmoji: {
        fontSize: 20,
        marginRight: 10,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    statusChip: {
        height: 24,
        marginLeft: 10,
    },
    metaRow: {
        marginTop: 10,
    },
    metaText: {
        fontSize: 13,
        color: '#666',
    },
    progressSection: {
        marginTop: 15,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        color: '#888',
    },
    progressValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    cardActions: {
        justifyContent: 'flex-end',
        paddingTop: 0,
    },
    updateButtonLabel: {
        color: '#8b5cf6',
        fontSize: 13,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 15,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
});

export default StaffDashboard;
