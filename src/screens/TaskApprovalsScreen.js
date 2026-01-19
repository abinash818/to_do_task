import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Card, Chip, Title, IconButton, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const TaskApprovalsScreen = ({ navigation }) => {
    const { getTasks } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const allTasks = await getTasks();
            // Filter only pending approvals
            const pendingApprovals = allTasks.filter(t => t.status === 'waiting_approval');
            setTasks(pendingApprovals);
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

    const renderItem = ({ item, index }) => {
        const daysRemaining = Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24));

        return (
            <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20 * (index + 1), 0] }) }]
            }}>
                <TouchableOpacity onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}>
                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.headerRow}>
                                <Title style={styles.title}>{item.title}</Title>
                                <Chip icon="clock" style={{ backgroundColor: '#fffbeb' }} textStyle={{ color: '#d97706', fontSize: 12 }}>
                                    Waiting Approval
                                </Chip>
                            </View>

                            <Text style={styles.staffName}>Submitted by: {item.assignedTo?.name || 'Unknown'}</Text>

                            {item.submissionNote ? (
                                <View style={styles.noteBox}>
                                    <Text style={styles.noteLabel}>Note:</Text>
                                    <Text numberOfLines={2} style={styles.noteText}>{item.submissionNote}</Text>
                                </View>
                            ) : null}

                            <View style={styles.footerRow}>
                                <Text style={styles.date}>📅 Due: {new Date(item.deadline).toLocaleDateString()}</Text>
                                <Button mode="text" labelStyle={{ color: '#8b5cf6' }}>Review →</Button>
                            </View>
                        </Card.Content>
                    </Card>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Title style={styles.headerTitle}>Pending Approvals</Title>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : (
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No pending approvals 🎉</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 10,
        backgroundColor: '#fff',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    list: {
        padding: 15,
    },
    card: {
        marginBottom: 15,
        borderRadius: 15,
        backgroundColor: '#fff',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10,
    },
    staffName: {
        fontSize: 13,
        color: '#666',
        marginBottom: 10,
    },
    noteBox: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    noteLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 2,
    },
    noteText: {
        fontSize: 13,
        color: '#333',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    date: {
        fontSize: 12,
        color: '#888',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
});

export default TaskApprovalsScreen;
