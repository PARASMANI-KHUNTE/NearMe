import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import StartupAnimation from './src/components/StartupAnimation';
import { useAppTheme } from './src/hooks/useAppTheme';
import { checkAndApplyOtaUpdate } from './src/services/otaUpdate';

export default function App() {
  const [showStartup, setShowStartup] = useState(true);
  const { isDay } = useAppTheme();

  useEffect(() => {
    if (!showStartup) {
      checkAndApplyOtaUpdate();
    }
  }, [showStartup]);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDay ? 'dark' : 'light'} />
      {showStartup ? (
        <StartupAnimation onFinish={() => setShowStartup(false)} />
      ) : (
        <AppNavigator />
      )}
    </SafeAreaProvider>
  );
}
