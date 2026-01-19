import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import AddStaffScreen from './src/screens/AddStaffScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import ManagePlansScreen from './src/screens/ManagePlansScreen';
import EditPlanScreen from './src/screens/EditPlanScreen';
import AssignTaskScreen from './src/screens/AssignTaskScreen';
import CustomerEntryScreen from './src/screens/CustomerEntryScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ManageStaffScreen from './src/screens/ManageStaffScreen';
import StaffDashboard from './src/screens/StaffDashboard';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityIndicator, View, Platform } from 'react-native';

const Stack = createStackNavigator();

const Navigation = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : userRole === 'admin' ? (
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="AddStaff" component={AddStaffScreen} />
          <Stack.Screen name="ManagePlans" component={ManagePlansScreen} />
          <Stack.Screen name="EditPlan" component={EditPlanScreen} />
          <Stack.Screen name="AssignTask" component={AssignTaskScreen} />
          <Stack.Screen name="CustomerEntry" component={CustomerEntryScreen} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="ManageStaff" component={ManageStaffScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="StaffDashboard" component={StaffDashboard} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        /* Force page-level scrolling */
        html { height: 100%; overflow-y: scroll; }
        body { min-height: 100%; overflow-y: auto; }
        #root { display: flex; flex-direction: column; min-height: 100%; }

        /* Custom Scrollbar Styling */
        ::-webkit-scrollbar { width: 12px; height: 12px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 6px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
    `;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }
  }, []);

  return (
    <AuthProvider>
      <PaperProvider>
        <NavigationContainer>
          <Navigation />
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}
