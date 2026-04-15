import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { authApi } from '../api/auth.api';
import { colors } from '../constants/theme';
import { useAuthStore } from '../store/auth.store';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { navigationRef } from './navigationRef';
import { ROUTES } from './routes';

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function RootNavigator() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      const parsed = Linking.parse(url);
      const path = parsed.path ?? '';
      const token = typeof parsed.queryParams?.token === 'string' ? parsed.queryParams.token : undefined;
      if (!token) return;

      if (path === 'verify-email') {
        try {
          const payload = await authApi.verifyEmail(token);
          await login(payload);
        } catch {}
        return;
      }

      if (path === 'reset-password' && navigationRef.isReady()) {
        (navigationRef.navigate as (name: string, params?: object) => void)(ROUTES.RESET_PASSWORD, { token });
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) {
        void handleDeepLink(url);
      }
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [login]);

  useEffect(() => {
    void loadFromStorage();
  }, [loadFromStorage]);

  return (
    <NavigationContainer ref={navigationRef}>
      {isLoading ? <SplashScreen /> : isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.primary },
});
