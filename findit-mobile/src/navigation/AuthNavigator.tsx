import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from './routes';
import { AuthStackParamList } from './types';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName={ROUTES.LOGIN}>
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} options={{ title: 'Connexion' }} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} options={{ title: 'Inscription' }} />
      <Stack.Screen
        name={ROUTES.VERIFY_EMAIL}
        component={VerifyEmailScreen}
        options={{ title: 'Verification email' }}
      />
      <Stack.Screen
        name={ROUTES.FORGOT_PASSWORD}
        component={ForgotPasswordScreen}
        options={{ title: 'Mot de passe oublie' }}
      />
      <Stack.Screen
        name={ROUTES.RESET_PASSWORD}
        component={ResetPasswordScreen}
        options={{ title: 'Reinitialiser le mot de passe' }}
      />
    </Stack.Navigator>
  );
}
