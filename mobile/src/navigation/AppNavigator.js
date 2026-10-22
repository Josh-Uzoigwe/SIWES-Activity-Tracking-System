import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import StudentHomeScreen from '../screens/StudentHomeScreen';
import CreateLogScreen from '../screens/CreateLogScreen';
import LogDetailScreen from '../screens/LogDetailScreen';
import SupervisorHomeScreen from '../screens/SupervisorHomeScreen';
import CoordinatorHomeScreen from '../screens/CoordinatorHomeScreen';
import ItfHomeScreen from '../screens/ItfHomeScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: '#ffffff',
  },
  headerTintColor: '#0f172a',
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 16,
  },
  headerShadowVisible: true,
};

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          // 1. Auth Stack
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : user.role === 'STUDENT' ? (
          // 2. Student Stack
          <>
            <Stack.Screen
              name="StudentHome"
              component={StudentHomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateLog"
              component={CreateLogScreen}
              options={{ title: 'Log Daily Activity' }}
            />
            <Stack.Screen
              name="LogDetail"
              component={LogDetailScreen}
              options={{ title: 'Activity Entry Details' }}
            />
          </>
        ) : user.role === 'ITF' ? (
          // 3. Federal ITF Officer Stack
          <>
            <Stack.Screen
              name="ItfHome"
              component={ItfHomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LogDetail"
              component={LogDetailScreen}
              options={{ title: 'Activity Entry Details' }}
            />
          </>
        ) : user.role === 'COORDINATOR' ? (
          // 4. Institutional Coordinator Stack
          <>
            <Stack.Screen
              name="CoordinatorHome"
              component={CoordinatorHomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LogDetail"
              component={LogDetailScreen}
              options={{ title: 'Activity Entry Details' }}
            />
          </>
        ) : (
          // 5. Academic & Industry Supervisor Stack
          <>
            <Stack.Screen
              name="SupervisorHome"
              component={SupervisorHomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LogDetail"
              component={LogDetailScreen}
              options={{ title: 'Review Entry' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});

export default AppNavigator;
