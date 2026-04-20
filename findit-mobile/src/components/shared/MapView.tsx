import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View, ViewStyle } from 'react-native';
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
  imageSource?: ImageSourcePropType;
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
          {markers.map((marker) => {
            if (!marker.imageSource) {
              return (
                <Marker
                  key={marker.id}
                  coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                  title={marker.title}
                  description={marker.description}
                  onPress={marker.onPress}
                  pinColor={marker.color ?? colors.primary}
                  tracksViewChanges={false}
                />
              );
            }

            return (
              <Marker
                key={marker.id}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                title={marker.title}
                description={marker.description}
                onPress={marker.onPress}
                tracksViewChanges={true}
              >
                <View style={styles.markerWrap}>
                  <View
                    style={[
                      styles.markerCircle,
                      { borderColor: marker.color ?? colors.primary },
                    ]}
                  >
                    <Image
                      source={marker.imageSource}
                      style={styles.markerImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View
                    style={[
                      styles.markerPointer,
                      { backgroundColor: marker.color ?? colors.primary },
                    ]}
                  />
                </View>
              </Marker>
            );
          })}
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
  markerWrap: {
    alignItems: 'center',
  },
  markerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    backgroundColor: colors.background.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  markerPointer: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: -3,
  },
});
