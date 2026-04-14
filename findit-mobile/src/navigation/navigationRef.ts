import { createNavigationContainerRef } from '@react-navigation/native';

import { ROUTES } from './routes';

export const navigationRef = createNavigationContainerRef();

export function navigateToLogin(): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: ROUTES.LOGIN }] });
  }
}
