import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, StatusBar, TouchableOpacity, Modal, Platform } from 'react-native';
import { Card, Title, Paragraph, DataTable, Chip, IconButton, ActivityIndicator, Button, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Svg, Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ReportsScreen = ({ navigation }) => {
    const { getTasks, getStaff, getPlans } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        processing: 0,
        pending: 0,
        overdue: 0,
    });
    const [tasks, setTasks] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filter, setFilter] = useState('all'); // all, completed, processing, pending, overdue

    // Force scrollbar on web (Handled globally in App.js now)
    // useEffect(() => { ... }, []);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const [tasksData, staffData] = await Promise.all([
                        getTasks().catch(() => []),
                        getStaff().catch(() => [])
                    ]);

                    setTasks(tasksData);
                    setStaffList(staffData);

                    setStats({
                        total: tasksData.length,
                        completed: tasksData.filter(t => t.status === 'completed').length,
                        processing: tasksData.filter(t => t.status === 'processing').length,
                        pending: tasksData.filter(t => t.status === 'pending').length,
                        overdue: tasksData.filter(t => t.status === 'overdue').length,
                    });
                } catch (error) {
                    console.error('Failed to fetch report data:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }, [getTasks, getStaff])
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed':
                return { bg: '#d1fae5', color: '#059669', label: 'Completed' };
            case 'processing':
                return { bg: '#dbeafe', color: '#2563eb', label: 'Processing' };
            case 'overdue':
                return { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' };
            default:
                return { bg: '#fef3c7', color: '#d97706', label: 'Pending' };
        }
    };

    const DashboardStat = ({ title, count, label }) => (
        <View style={styles.dashboardCard}>
            <View style={styles.cardHeaderRow}>
                <Text style={styles.statTitle}>{title}</Text>
                <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>1 Filter</Text>
                </View>
            </View>
            <Text style={styles.statNumber}>{count}</Text>
            <Text style={styles.statSub}>{label}</Text>
        </View>
    );

    const chartConfig = {
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        color: (opacity = 1) => `rgba(108, 93, 211, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.7,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
    };

    const getProgress = (subtasks) => {
        if (!subtasks || subtasks.length === 0) return 0;
        return Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100);
    };

    // Filter tasks based on selected filter
    const filteredTasks = filter === 'all'
        ? tasks
        : tasks.filter(t => t.status === filter);

    const filterOptions = [
        { key: 'all', label: 'All', icon: '📋', color: '#6366f1' },
        { key: 'completed', label: 'Completed', icon: '✅', color: '#10b981' },
        { key: 'processing', label: 'Processing', icon: '⚙️', color: '#3b82f6' },
        { key: 'pending', label: 'Pending', icon: '📋', color: '#f59e0b' },
        { key: 'overdue', label: 'Overdue', icon: '⚠️', color: '#ef4444' },
    ];

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    const MainScroll = Platform.OS === 'web' ? View : ScrollView;
    const scrollProps = Platform.OS === 'web'
        ? { style: { height: '100vh', overflowY: 'scroll', display: 'block' } }
        : {
            style: styles.content,
            contentContainerStyle: styles.scrollContent,
            showsVerticalScrollIndicator: true
        };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <MainScroll {...scrollProps}>
                {/* Dashboard Header */}
                <View style={[styles.header, { backgroundColor: '#FAFBFC', paddingTop: 20, paddingBottom: 10 }]}>
                    <View style={styles.headerRow}>
                        <IconButton icon="arrow-left" iconColor="#111" size={24} onPress={() => navigation.goBack()} />
                        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111' }}>Dashboard</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconButton icon="magnify" iconColor="#666" size={24} />
                            <IconButton icon="plus-box" iconColor="#F06A6A" size={28} />
                        </View>
                    </View>
                </View>

                <View style={styles.innerContent}>
                    {/* Stats Grid */}
                    <View style={[styles.statsGrid, { marginTop: 10 }]}>
                        <DashboardStat title="Completed Tasks" count={stats.completed} label="Task count" />
                        <DashboardStat title="Incompleted Tasks" count={stats.pending + stats.processing} label="Task count" />
                        <DashboardStat title="Overdue Tasks" count={stats.overdue} label="Task count" />
                        <DashboardStat title="Total Tasks" count={stats.total} label="Task count" />
                    </View>

                    {/* Bar Chart */}
                    <View style={[styles.dashboardCard, styles.dashboardCardFull]}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.statTitle}>Incompleted task by status</Text>
                            <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>2 Filter</Text></View>
                        </View>
                        <BarChart
                            data={{
                                labels: ["Pending", "Process", "Overdue"],
                                datasets: [{ data: [stats.pending || 0, stats.processing || 0, stats.overdue || 0] }]
                            }}
                            width={Dimensions.get("window").width - 70}
                            height={220}
                            yAxisLabel=""
                            chartConfig={{
                                ...chartConfig,
                                color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`, // Pink color
                            }}
                            verticalLabelRotation={0}
                            showBarTops={false}
                            fromZero
                        />
                    </View>

                    {/* Task Details Table */}

                    {/* Task Details Table */}
                    <Text style={styles.sectionTitle}>Task Details</Text>

                    {/* Filter Chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        {filterOptions.map(opt => (
                            <TouchableOpacity
                                key={opt.key}
                                style={[
                                    styles.filterChip,
                                    filter === opt.key && { backgroundColor: opt.color }
                                ]}
                                onPress={() => setFilter(opt.key)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    filter === opt.key && styles.filterChipTextActive
                                ]}>
                                    {opt.icon} {opt.label} {opt.key === 'all' ? `(${stats.total})` :
                                        opt.key === 'completed' ? `(${stats.completed})` :
                                            opt.key === 'processing' ? `(${stats.processing})` :
                                                opt.key === 'pending' ? `(${stats.pending})` :
                                                    `(${stats.overdue})`
                                    }
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.filterInfo}>Showing {filteredTasks.length} tasks</Text>

                    <Card style={styles.tableCard}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <DataTable>
                                <DataTable.Header>
                                    <DataTable.Title style={styles.colWide}>Task</DataTable.Title>
                                    <DataTable.Title style={styles.colMedium}>Assigned To</DataTable.Title>
                                    <DataTable.Title style={styles.colSmall}>Status</DataTable.Title>
                                    <DataTable.Title style={styles.colSmall} numeric>Progress</DataTable.Title>
                                    <DataTable.Title style={styles.colMedium}>Deadline</DataTable.Title>
                                </DataTable.Header>

                                <ScrollView
                                    style={{ maxHeight: 500 }}
                                    nestedScrollEnabled={true}
                                >

                                    {filteredTasks.map((task, index) => {
                                        const statusStyle = getStatusStyle(task.status);
                                        const assignee = task.assignedTo?.name || 'Unassigned';
                                        const progress = getProgress(task.subtasks);

                                        return (
                                            <TouchableOpacity
                                                key={task._id || index}
                                                onPress={() => setSelectedTask(task)}
                                                activeOpacity={0.7}
                                            >
                                                <DataTable.Row>
                                                    <DataTable.Cell style={styles.colWide}>
                                                        <Text numberOfLines={1} style={styles.taskName}>{task.title}</Text>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell style={styles.colMedium}>
                                                        <Text>{assignee}</Text>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell style={styles.colSmall}>
                                                        <Chip
                                                            mode="flat"
                                                            style={{ backgroundColor: statusStyle.bg }}
                                                            textStyle={{ color: statusStyle.color, fontSize: 10 }}
                                                        >
                                                            {statusStyle.label}
                                                        </Chip>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell style={styles.colSmall} numeric>
                                                        <Text style={{ fontWeight: 'bold' }}>{progress}%</Text>
                                                    </DataTable.Cell>
                                                    <DataTable.Cell style={styles.colMedium}>
                                                        <Text>{new Date(task.deadline).toLocaleDateString()}</Text>
                                                    </DataTable.Cell>
                                                </DataTable.Row>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </DataTable>
                        </ScrollView>
                    </Card>

                    {/* Task Stages Modal */}
                    <Modal
                        visible={!!selectedTask}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setSelectedTask(null)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>📋 Task Stages</Text>
                                    <IconButton icon="close" onPress={() => setSelectedTask(null)} />
                                </View>

                                {selectedTask && (
                                    <ScrollView style={styles.modalScroll}>
                                        <Text style={styles.modalTaskTitle}>{selectedTask.title}</Text>
                                        <Text style={styles.modalAssignee}>👤 {selectedTask.assignedTo?.name || 'Unassigned'}</Text>

                                        <View style={styles.progressSection}>
                                            <Text style={styles.progressText}>
                                                Progress: {selectedTask.subtasks?.filter(s => s.completed).length || 0}/{selectedTask.subtasks?.length || 0}
                                            </Text>
                                            <ProgressBar
                                                progress={getProgress(selectedTask.subtasks) / 100}
                                                color={getStatusStyle(selectedTask.status).color}
                                                style={styles.progressBar}
                                            />
                                        </View>

                                        <Text style={styles.stagesTitle}>Subtask Stages:</Text>
                                        {selectedTask.subtasks?.map((subtask, idx) => (
                                            <View key={idx} style={[
                                                styles.stageItem,
                                                subtask.completed && styles.stageCompleted
                                            ]}>
                                                <Text style={styles.stageNumber}>{idx + 1}</Text>
                                                <View style={styles.stageContent}>
                                                    <Text style={[
                                                        styles.stageTitle,
                                                        subtask.completed && styles.stageTitleCompleted
                                                    ]}>
                                                        {subtask.title}
                                                    </Text>
                                                    <Text style={styles.stageDays}>
                                                        {subtask.maxDays ? `${subtask.maxDays} days` : ''}
                                                    </Text>
                                                </View>
                                                <Text style={styles.stageStatus}>
                                                    {subtask.completed ? '✅' : '⏳'}
                                                </Text>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}

                                <Button
                                    mode="contained"
                                    onPress={() => setSelectedTask(null)}
                                    style={styles.modalButton}
                                >
                                    Close
                                </Button>
                            </View>
                        </View>
                    </Modal>

                    {/* Staff Summary */}
                    <Text style={styles.sectionTitle}>Staff Overview ({staffList.length} members)</Text>
                    <View style={styles.staffGrid}>
                        {staffList.map((staff, index) => {
                            const staffTasks = tasks.filter(t => t.assignedTo?._id === staff._id || t.assignedTo === staff._id);
                            const completedTasks = staffTasks.filter(t => t.status === 'completed').length;

                            return (
                                <Card key={staff._id || index} style={styles.staffCard}>
                                    <Card.Content>
                                        <Text style={styles.staffName}>{staff.name}</Text>
                                        <Text style={styles.staffUsername}>@{staff.username}</Text>
                                        <View style={styles.staffStats}>
                                            <Text style={styles.staffStat}>📋 {staffTasks.length} tasks</Text>
                                            <Text style={styles.staffStat}>✅ {completedTasks} done</Text>
                                        </View>
                                    </Card.Content>
                                </Card>
                            );
                        })}
                    </View>

                    <View style={{ height: 30 }} />
                </View>
            </MainScroll>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFC', // New light dashboard bg
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
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
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 50,
    },
    innerContent: {
        padding: 15,
        paddingBottom: 50,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 15,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // flexWrap: 'wrap', // Removed wrap for single line
    },
    dashboardCard: {
        backgroundColor: '#fff',
        borderRadius: 12, // Slightly smaller radius
        padding: 10, // Reduced padding
        marginBottom: 15,
        flex: 1, // Distribute space evenly
        marginHorizontal: 4, // Add small spacing between cards
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    dashboardCardFull: {
        width: '100%',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    statTitle: {
        fontSize: 11, // Smaller title
        fontWeight: '600',
        color: '#111827',
    },
    statNumber: {
        fontSize: 20, // Smaller number
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 5,
    },
    statSub: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 5,
    },
    filterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    filterBadgeText: {
        fontSize: 10,
        color: '#0EA5E9',
        fontWeight: '600',
        marginLeft: 4,
    },
    tableCard: {
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    filterScroll: {
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    filterChip: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#e5e7eb',
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterChipText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    filterInfo: {
        fontSize: 12,
        color: '#888',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    colWide: {
        width: 180,
    },
    colMedium: {
        width: 120,
    },
    colSmall: {
        width: 100,
    },
    taskName: {
        fontWeight: '500',
    },
    staffGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    staffCard: {
        width: (width - 45) / 2,
        marginBottom: 10,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    staffName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    staffUsername: {
        fontSize: 12,
        color: '#888',
        marginBottom: 10,
    },
    staffStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    staffStat: {
        fontSize: 12,
        color: '#666',
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
        maxHeight: '80%',
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
    modalScroll: {
        maxHeight: 400,
    },
    modalTaskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    modalAssignee: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    progressSection: {
        marginBottom: 20,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
    },
    stagesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    stageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    stageCompleted: {
        backgroundColor: '#d1fae5',
        borderLeftColor: '#10b981',
    },
    stageNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#667eea',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 28,
        fontWeight: 'bold',
        marginRight: 12,
        overflow: 'hidden',
    },
    stageContent: {
        flex: 1,
    },
    stageTitle: {
        fontSize: 14,
        color: '#333',
    },
    stageTitleCompleted: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    stageDays: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    stageStatus: {
        fontSize: 18,
        marginLeft: 10,
    },
    modalButton: {
        marginTop: 15,
        borderRadius: 10,
    },
});

export default ReportsScreen;
