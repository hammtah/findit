import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { formatDistance } from '../../utils/formatDistance';

interface MatchCardProps {
  match: {
    id: string;
    score: number;
    report_found: {
      id: string;
      titre: string;
      adresse: string;
      first_photo_url: string | null;
    };
    distance_meters: number | null;
  };
  onPress: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const distanceLabel =
    match.distance_meters === null
      ? match.report_found.adresse
      : formatDistance(match.distance_meters);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${match.report_found.titre}. Similarite ${Math.round(match.score)} pour cent. ${distanceLabel}.`}
      accessibilityHint="Ouvrir ce signalement similaire"
    >
      <View style={styles.imageWrapper}>
        {match.report_found.first_photo_url ? (
          <Image
            source={{ uri: match.report_found.first_photo_url }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText} allowFontScaling={false}>📦</Text>
          </View>
        )}
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText} allowFontScaling minimumFontScale={0.9}>{Math.round(match.score)}%</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2} allowFontScaling minimumFontScale={0.9}>
        {match.report_found.titre}
      </Text>
      <Text style={styles.caption} numberOfLines={1} allowFontScaling minimumFontScale={0.9}>
        {distanceLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    marginRight: spacing.md,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 28,
  },
  scoreBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  scoreText: {
    ...typography.caption,
    color: colors.text.inverse,
  },
  title: {
    ...typography.label,
    color: colors.text.primary,
  },
  caption: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
