import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { AppNavigator } from './src/navigation/AppNavigator';
import StartupAnimation from './src/components/StartupAnimation';
import { useAppTheme } from './src/hooks/useAppTheme';
import { checkAndApplyOtaUpdate } from './src/services/otaUpdate';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const defaultErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('Global Error Caught:', error);
  if (__DEV__ || isFatal) {
    defaultErrorHandler(error, isFatal);
    return;
  }
});

// Required for expo-auth-session to close the auth popup
export default function App() {
  const [showStartup, setShowStartup] = useState(true);
  const { isDay } = useAppTheme();

  useEffect(() => {
    // Required for expo-auth-session to close the auth popup
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  useEffect(() => {
    if (!showStartup) {
      checkAndApplyOtaUpdate();
    }
  }, [showStartup]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style={isDay ? 'dark' : 'light'} />
        {showStartup ? (
          <StartupAnimation onFinish={() => setShowStartup(false)} />
        ) : (
          <AppNavigator />
        )}
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
