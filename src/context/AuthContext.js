import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

let API_URL = 'http://localhost:5000/api';
if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        API_URL = '/api';
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                const storedToken = await AsyncStorage.getItem('token');
                if (storedUser && storedToken) {
                    setUser(JSON.parse(storedUser));
                    setToken(storedToken);
                }
            } catch (e) {
                console.error('Failed to load storage', e);
            } finally {
                setLoading(false);
            }
        };
        loadStorageData();
    }, []);

    const login = async (username, password) => {
        console.log(`Attempting login for: ${username} at ${API_URL}/users/login`);
        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            console.log('Login response status:', response.status);
            const data = await response.json();

            if (!response.ok) {
                console.error('Login failed data:', data);
                if (Platform.OS === 'web') alert(data.message || 'Login failed');
                throw new Error(data.message || 'Login failed');
            }

            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            setToken(data.token);
            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            if (Platform.OS === 'web') alert('Network Error: Check if backend is running');
            throw error;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    const registerStaff = async (staffData) => {
        const response = await fetch(`${API_URL}/users/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(staffData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create staff');
        }

        return data;
    };

    const getPlans = async () => {
        const response = await fetch(`${API_URL}/plans`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch plans');
        return data;
    };

    const createPlan = async (planData) => {
        const response = await fetch(`${API_URL}/plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(planData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create plan');
        return data;
    };

    const assignTask = async (taskData) => {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to assign task');
        return data;
    };

    const getTasks = async () => {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch tasks');
        return data;
    };

    const updateTaskProgress = async (taskId, updates) => {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update task');
        return data;
    };

    const getStaff = async () => {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch staff');
        return data.filter(u => u.role === 'staff');
    };

    return (
        <AuthContext.Provider value={{
            user,
            userRole: user?.role,
            login,
            logout,
            registerStaff,
            loading,
            token,
            getPlans,
            createPlan,
            assignTask,
            getTasks,
            getStaff,
            updateTaskProgress
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
