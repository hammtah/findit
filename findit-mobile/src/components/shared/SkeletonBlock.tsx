import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { borderRadius, colors } from '../../constants/theme';

interface SkeletonBlockProps {
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBlock({ style }: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [opacity]);

  return <Animated.View style={[styles.base, { opacity }, style]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
  },
});
