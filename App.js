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
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ManageStaffScreen from './src/screens/ManageStaffScreen';
import StaffDashboard from './src/screens/StaffDashboard';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

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
