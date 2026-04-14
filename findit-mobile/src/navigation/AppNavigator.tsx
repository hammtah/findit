import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../constants/theme';
import { ConversationsScreen } from '../screens/chat/ConversationsScreen';
import { FeedScreen } from '../screens/feed/FeedScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { CreateReportScreen } from '../screens/report/CreateReportScreen';
import { ReportDetailScreen } from '../screens/report/ReportDetailScreen';
import { ROUTES } from './routes';
import { AppTabParamList, FeedStackParamList } from './types';

const Tabs = createBottomTabNavigator<AppTabParamList>();
const FeedStack = createNativeStackNavigator<FeedStackParamList>();

function FeedStackNavigator() {
  return (
    <FeedStack.Navigator>
      <FeedStack.Screen name={ROUTES.FEED} component={FeedScreen} options={{ title: 'FindIt' }} />
      <FeedStack.Screen name={ROUTES.REPORT_DETAIL} component={ReportDetailScreen} options={{ title: 'Detail' }} />
    </FeedStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            [ROUTES.FEED]: 'list',
            [ROUTES.CREATE_REPORT]: 'add-circle',
            [ROUTES.CONVERSATIONS]: 'chatbubble-ellipses',
            [ROUTES.PROFILE]: 'person',
          };
          return <Ionicons name={map[route.name] ?? 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name={ROUTES.FEED} component={FeedStackNavigator} options={{ title: 'Feed' }} />
      <Tabs.Screen name={ROUTES.CREATE_REPORT} component={CreateReportScreen} options={{ title: 'Creer' }} />
      <Tabs.Screen name={ROUTES.CONVERSATIONS} component={ConversationsScreen} options={{ title: 'Conversations' }} />
      <Tabs.Screen name={ROUTES.PROFILE} component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tabs.Navigator>
  );
}
