import 'react-native-gesture-handler';
import { useEffect } from 'react';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/auth.store';
import SocketService from './src/services/socket.service';
import { getAccessToken } from './src/utils/tokenStorage';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    let isMounted = true;
    const connectSocket = async () => {
      if (isAuthenticated) {
        const token = await getAccessToken();
        if (token && isMounted) {
          SocketService.connect(token);
        }
      } else {
        SocketService.disconnect();
      }
    };
    connectSocket();
    return () => {
      isMounted = false;
      SocketService.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
