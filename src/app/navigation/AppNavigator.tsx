import React, { useCallback, useState } from 'react';
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

export type RootStackParamList = {
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
  const [devMenuVisible, setDevMenuVisible] = useState(false);

  const handleSecretGesture = useCallback(() => {
    setDevMenuVisible(true);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
