import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ROUTES } from './routes';

export type AuthStackParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTER]: undefined;
  [ROUTES.VERIFY_EMAIL]: { email?: string } | undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
  [ROUTES.RESET_PASSWORD]: { token?: string } | undefined;
};

export type FeedStackParamList = {
  [ROUTES.FEED_HOME]: undefined;
  [ROUTES.REPORT_DETAIL]: { reportId: string };
  [ROUTES.USER_PUBLIC_PROFILE]: { userId: string } | undefined;
};

export type FeedStackScreenProps<RouteName extends keyof FeedStackParamList> =
  NativeStackScreenProps<FeedStackParamList, RouteName>;

export type ConversationsStackParamList = {
  [ROUTES.CONVERSATIONS_LIST]: undefined;
  [ROUTES.CHAT]: { conversationId: string };
};

export type AppTabParamList = {
  [ROUTES.FEED]: undefined;
  [ROUTES.CREATE_REPORT]:
    | { type?: 'lost' | 'found'; reportId?: string }
    | undefined;
  [ROUTES.CONVERSATIONS]: undefined;
  [ROUTES.PROFILE]: undefined;
};
