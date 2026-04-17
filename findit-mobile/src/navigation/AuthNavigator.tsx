import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from './routes';
import { AuthStackParamList } from './types';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName={ROUTES.LOGIN}>
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} options={{ title: 'Connexion' }} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} options={{ title: 'Inscription' }} />
    </Stack.Navigator>
  );
}
