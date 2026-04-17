import { NativeModules, Platform } from 'react-native';

const DEFAULT_API_PORT = '3000';

const normalizeBaseUrl = (url: string): string => url.trim().replace(/\/$/, '');

function getHostFromScriptURL(): string | null {
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) return null;

  const match = scriptURL.match(/^[a-zA-Z]+:\/\/([^/:?#]+)(?::\d+)?/);
  return match?.[1] ?? null;
}

function getFallbackApiBaseUrl(): string {
  const host = getHostFromScriptURL();

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${DEFAULT_API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}`;
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

export const API_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_URL ?? getFallbackApiBaseUrl(),
);
