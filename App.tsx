import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import AppNavigator from './src/app/navigation/AppNavigator';
import { AppProvider } from './src/app/providers/AppProvider';
import { AuthProvider } from './src/app/providers/AuthProvider';
import EnvGate from './src/app/components/EnvGate';
import { GlobalErrorBoundary } from './src/app/components/GlobalErrorBoundary';

export default function App(): JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <GlobalErrorBoundary>
        <AppProvider>
          <EnvGate>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </EnvGate>
        </AppProvider>
      </GlobalErrorBoundary>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1224',
  },
});
