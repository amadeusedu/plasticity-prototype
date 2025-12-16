import React, { useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DevMenuScreen from '../screens/DevMenuScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import GameRunnerScreen from '../screens/GameRunnerScreen';

export type RootStackParamList = {
  Home: undefined;
  DevMenu: undefined;
  GameDetail: { gameId: string };
  GameRunner: { gameId: string; mode?: 'tutorial' | 'assessment' | 'normal' };
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
          {(props) => (
            <HomeScreen
              {...props}
              devMenuVisible={devMenuVisible}
              onRequestDevMenu={() => setDevMenuVisible(true)}
              onSecretGesture={handleSecretGesture}
            />
          )}
        </Stack.Screen>
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
