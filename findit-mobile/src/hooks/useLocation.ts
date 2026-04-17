import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  coords: { latitude: number; longitude: number } | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  manualAddress: string | null;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  setManualAddress: (address: string) => void;
}

export function useLocation(): LocationState {
  const [coords, setCoords] = useState<LocationState['coords']>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationState['permissionStatus']>('undetermined');
  const [manualAddress, setManualAddressState] =
    useState<LocationState['manualAddress']>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkPermission = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (!isMounted) return;
        if (status === Location.PermissionStatus.GRANTED) {
          setPermissionStatus('granted');
          setIsLoading(true);
          try {
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            if (!isMounted) return;
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          } catch (err) {
            if (!isMounted) return;
            setError('Impossible de récupérer la position actuelle.');
          } finally {
            if (isMounted) setIsLoading(false);
          }
        } else if (status === Location.PermissionStatus.DENIED) {
          setPermissionStatus('denied');
          setCoords(null);
        } else {
          setPermissionStatus('undetermined');
        }
      } catch {
        if (!isMounted) return;
        setError('Erreur lors de la vérification de la permission de localisation.');
      }
    };

    void checkPermission();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === Location.PermissionStatus.GRANTED) {
        setPermissionStatus('granted');
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } else {
        setPermissionStatus('denied');
        setCoords(null);
      }
    } catch {
      setError('Erreur lors de la demande de permission de localisation.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setManualAddress = useCallback((address: string) => {
    setManualAddressState(address);
  }, []);

  return {
    coords,
    permissionStatus,
    manualAddress,
    isLoading,
    error,
    requestPermission,
    setManualAddress,
  };
}

