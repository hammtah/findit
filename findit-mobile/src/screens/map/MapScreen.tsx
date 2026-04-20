import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { ReusableMapView, ReusableMapViewRef } from '../../components/shared/MapView';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../navigation/routes';
import { useInfiniteReports } from '../../hooks/useInfiniteReports';

 const LOST_PLACEHOLDER = require('../../../assets/icon.png');
 const FOUND_PLACEHOLDER = require('../../../assets/adaptive-icon.png');

 export function MapScreen() {
  const { reports, refresh, isLoading, error } = useInfiniteReports();

  useEffect(() => {
    console.info('[MapScreen] reports updated:', reports.length, reports);
  }, [reports]);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const mapRef = useRef<ReusableMapViewRef>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoadingLocation(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error) {
        console.error('Error getting location:', error);
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const handleCenterOnLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      
      mapRef.current?.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
    }
  };

  const handleSync = () => {
    refresh();
  };

  const mapMarkers = reports
    .filter((report) => Number.isFinite(report.latitude) && Number.isFinite(report.longitude))
    .map((report) => ({
      id: report.id,
      latitude: report.latitude as number,
      longitude: report.longitude as number,
      title: report.titre,
      description: report.adresse,
      color: report.type === 'lost' ? colors.danger : colors.secondary,
      imageSource: report.type === 'lost' ? LOST_PLACEHOLDER : FOUND_PLACEHOLDER,
      onPress: () => {
        navigation.navigate(ROUTES.REPORT_DETAIL, {
          reportId: report.id,
        });
      }
    }));

  if (loadingLocation && !location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initialisation du GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReusableMapView
        ref={mapRef}
        initialRegion={location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : undefined}
        markers={mapMarkers}
        showUserLocation={true}
      />

      {(error || !location) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "En attente de votre position GPS..."}
          </Text>
        </View>
      )}

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleSync}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleCenterOnLocation}
          activeOpacity={0.7}
        >
          <Ionicons name="locate" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exploration</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <Text style={styles.legendText}>Perdus</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.legendText}>Trouvés</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.text.secondary,
  },
  errorContainer: {
    position: 'absolute',
    top: spacing.xl * 2,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    color: colors.text.inverse,
    textAlign: 'center',
    ...typography.label,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.background.card,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
