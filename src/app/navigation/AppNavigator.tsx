import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DevMenuScreen from '../screens/DevMenuScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import GameRunnerScreen from '../screens/GameRunnerScreen';
import AssessmentScreen from '../screens/AssessmentScreen';
import PlanScreen from '../screens/PlanScreen';
import ReportsScreen from '../screens/ReportsScreen';
import { SessionConfig } from '../../games/types';
import AuthScreen from '../screens/AuthScreen';
import { useAuth } from '../providers/AuthProvider';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  DevMenu: undefined;
  GameDetail: { gameId: string };
  GameRunner: {
    gameId: string;
    mode?: 'tutorial' | 'assessment' | 'normal';
    sessionOverride?: SessionConfig;
    runContext?: { assessmentId?: string };
  };
  Assessment: undefined;
  Plan: undefined;
  Reports: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator(): JSX.Element {
  const { user, loading } = useAuth();
  const [devMenuVisible, setDevMenuVisible] = useState(false);

  const handleSecretGesture = useCallback(() => {
    setDevMenuVisible(true);
  }, []);

  if (loading) {
    return (
      <NavigationContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Checking session…</Text>
        </View>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator initialRouteName="Home" key="app">
          <Stack.Screen name="Home" options={{ title: 'Plasticity' }}>
            {(props: any) => (
              <HomeScreen
                {...props}
                devMenuVisible={devMenuVisible}
                onRequestDevMenu={() => setDevMenuVisible(true)}
                onSecretGesture={handleSecretGesture}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Assessment" component={AssessmentScreen} options={{ title: 'Baseline' }} />
          <Stack.Screen name="Plan" component={PlanScreen} options={{ title: 'Plan' }} />
          <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
          <Stack.Screen name="GameDetail" component={GameDetailScreen} options={{ title: 'Game' }} />
          <Stack.Screen name="GameRunner" component={GameRunnerScreen} options={{ title: 'Session' }} />
          <Stack.Screen
            name="DevMenu"
            component={DevMenuScreen}
            options={{ title: 'DEV_MENU', presentation: 'modal' }}
          />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              title: 'Sign in',
              presentation: 'modal',
            }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator initialRouteName="Auth" key="auth">
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1224',
    gap: 8,
  },
  loadingText: {
    color: '#cbd5e1',
  },
});
