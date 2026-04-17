import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { colors } from '../constants/theme';
import { useAuthStore } from '../store/auth.store';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

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

  useEffect(() => {
    void loadFromStorage();
  }, [loadFromStorage]);

  return (
    <NavigationContainer>
      {isLoading ? <SplashScreen /> : isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      {/* <AppNavigator /> */}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.primary },
});
