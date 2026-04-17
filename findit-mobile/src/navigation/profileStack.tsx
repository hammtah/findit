import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from './routes';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';

const Stack = createNativeStackNavigator();

export function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} options={{ title: 'Profil' }} />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ title: 'Modifier le profil' }} />
    </Stack.Navigator>
  );
}
