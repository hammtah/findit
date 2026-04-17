import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { authApi } from '../api/auth.api';
import { colors } from '../constants/theme';
import { navigationRef } from './navigationRef';
import { useAuthStore } from '../store/auth.store';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
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
    void loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        const parsedUrl = new URL(url);
        const token = parsedUrl.searchParams.get('token');
        const deepLinkTarget = parsedUrl.host;
        if (!token) {
          return;
        }

        if (deepLinkTarget === 'verify-email') {
          const payload = await authApi.verifyEmail(token);
          await login(payload);
          return;
        }

        if (deepLinkTarget === 'reset-password' && navigationRef.isReady()) {
          (navigationRef as any).navigate(ROUTES.RESET_PASSWORD, { token });
        }
      } catch {
        // Invalid deep link URLs are ignored.
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleDeepLink(url);
    });

    void Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        void handleDeepLink(initialUrl);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [login]);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* {isLoading ? <SplashScreen /> : isAuthenticated ? <AppNavigator /> : <AuthNavigator />} */}
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.primary },
});
