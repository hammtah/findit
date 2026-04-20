import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { colors } from '../../constants/theme';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  onPress?: () => void;
  color?: string;
}

export interface ReusableMapViewProps {
  initialRegion?: Region;
  markers?: MapMarker[];
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (event: any) => void;
  showUserLocation?: boolean;
  style?: ViewStyle;
}

export interface ReusableMapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options?: any) => void;
}

export const ReusableMapView = forwardRef<ReusableMapViewRef, ReusableMapViewProps>(
  ({ initialRegion, markers = [], onRegionChangeComplete, onPress, showUserLocation = true, style }, ref) => {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region, duration = 1000) => {
        mapRef.current?.animateToRegion(region, duration);
      },
      fitToCoordinates: (coordinates, options = { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true }) => {
        mapRef.current?.fitToCoordinates(coordinates, options);
      },
    }));

    return (
      <View style={[styles.container, style]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={showUserLocation}
          showsMyLocationButton={false}
          onRegionChangeComplete={onRegionChangeComplete}
          onPress={onPress}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
              title={marker.title}
              description={marker.description}
              onPress={marker.onPress}
              pinColor={marker.color ?? colors.primary}
            />
          ))}
        </MapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
