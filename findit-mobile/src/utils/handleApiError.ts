import type { AxiosError } from 'axios';

export function handleApiError(error: unknown): string {
  const defaultMessage = 'Une erreur est survenue. Veuillez réessayer.';

  const axiosError = error as AxiosError<any> | undefined;
  if (!axiosError || !axiosError.response) {
    return defaultMessage;
  }

  const data = axiosError.response.data as any;

  if (typeof data === 'string') return data;
  if (data?.message) {
    if (Array.isArray(data.message)) {
      return data.message.join('\n');
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
  }

  return defaultMessage;
}

