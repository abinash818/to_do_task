import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Button, Surface, IconButton, ActivityIndicator, FAB, Card, Title, Paragraph } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const ManagePlansScreen = ({ navigation }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const { getPlans } = useAuth();

    const fetchPlans = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getPlans();
            setPlans(data);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
            Alert.alert('Error', 'Could not load plans');
        } finally {
            setLoading(false);
        }
    }, [getPlans]);

    useFocusEffect(
        useCallback(() => {
            fetchPlans();
        }, [fetchPlans])
    );

    const renderPlanItem = ({ item }) => (
        <Card style={styles.card} onPress={() => navigation.navigate('EditPlan', { planId: item._id })}>
            <Card.Content>
                <Title>{item.name}</Title>
                <Paragraph>{item.description || 'No description'}</Paragraph>
                <Text style={styles.subtaskCount}>{item.subtasks.length} Subtasks</Text>
            </Card.Content>
            <Card.Actions>
                <Button onPress={() => navigation.navigate('EditPlan', { planId: item._id })}>Edit</Button>
            </Card.Actions>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Plan Templates</Text>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            ) : (
                <FlatList
                    data={plans}
                    renderItem={renderPlanItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyText}>No plans found. Create one!</Text>
                        </View>
                    }
                />
            )}

            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => navigation.navigate('EditPlan')}
                label="New Plan"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        elevation: 4,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    listContent: {
        padding: 15,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 15,
        borderRadius: 12,
    },
    subtaskCount: {
        marginTop: 5,
        color: '#666',
        fontSize: 12,
        fontStyle: 'italic',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#2196F3',
    },
});

export default ManagePlansScreen;
