import { ROUTES } from './routes';

export type AuthStackParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTER]: undefined;
  [ROUTES.VERIFY_EMAIL]: { email?: string } | undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
  [ROUTES.RESET_PASSWORD]: { token?: string } | undefined;
};

export type FeedStackParamList = {
  [ROUTES.FEED]: undefined;
  [ROUTES.REPORT_DETAIL]: { reportId: string };
  [ROUTES.USER_PUBLIC_PROFILE]: { userId: string } | undefined;
};

export type ConversationsStackParamList = {
  [ROUTES.CONVERSATIONS]: undefined;
  [ROUTES.CHAT]: { conversationId: string };
};

export type AppTabParamList = {
  [ROUTES.FEED]: undefined;
  [ROUTES.CREATE_REPORT]: undefined;
  [ROUTES.CONVERSATIONS]: undefined;
  [ROUTES.PROFILE]: undefined;
};
