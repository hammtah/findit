import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES } from '../../constants/categories';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { formatDate } from '../../utils/formatDate';
import { formatDistance } from '../../utils/formatDistance';

interface ReportCardProps {
  report: {
    id: string;
    type: 'lost' | 'found';
    titre: string;
    categorie: string;
    statut: string;
    adresse: string;
    distance_meters: number;
    first_photo_url: string | null;
    date_evenement: string;
    created_at: string;
    user: { nom: string; photo_url: string | null };
  };
  onPress: () => void;
}

export function ReportCard({ report, onPress }: ReportCardProps) {
  const category = CATEGORIES.find((c) => c.value === report.categorie);
  const distance = formatDistance(report.distance_meters);
  const created = formatDate(report.created_at);

  const statusLabel =
    report.statut === 'resolu'
      ? 'Résolu'
      : report.statut === 'rendu'
      ? 'Rendu'
      : 'En attente';

  const statusColor =
    report.statut === 'resolu' || report.statut === 'rendu'
      ? colors.secondary
      : colors.text.muted;

  const categoryColor = colors.categories[report.categorie as keyof typeof colors.categories] ?? colors.categories.autre;
  const accessibilitySummary = `${report.titre}. ${statusLabel}. ${distance}. ${report.adresse}.`;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilitySummary}
      accessibilityHint="Ouvrir le detail du signalement"
    >
      <View style={styles.row}>
        <View style={styles.imageContainer}>
          {report.first_photo_url ? (
            <Image
              source={{ uri: report.first_photo_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderEmoji} allowFontScaling={false}>{category?.icon ?? '📦'}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text numberOfLines={2} style={styles.title} allowFontScaling minimumFontScale={0.9}>
              {report.titre}
            </Text>
          </View>

          <View style={styles.metaRow}>
            {category ? (
              <View style={[styles.badge, { backgroundColor: categoryColor }]}>
                <Text style={styles.badgeText} allowFontScaling minimumFontScale={0.9}>{category.label}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.subline} numberOfLines={1} allowFontScaling minimumFontScale={0.9}>
            {distance} · {created}
          </Text>

          <Text style={styles.address} numberOfLines={1} allowFontScaling minimumFontScale={0.9}>
            {report.adresse}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View
          style={[
            styles.statusBadge,
            {
              borderColor: statusColor,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]} allowFontScaling minimumFontScale={0.9}>{statusLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
  },
  imageContainer: {
    marginRight: spacing.md,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.inverse,
  },
  subline: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  address: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  footerRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusText: {
    ...typography.caption,
  },
});

