import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

interface HistoryItemProps {
  item: {
    id: string;
    titre: string;
    categorie: string;
    date: string;
    statut: string;
    thumbnail_url?: string | null;
  };
  onPress: () => void;
}

export function HistoryItem({ item, onPress }: HistoryItemProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {item.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
      ) : (
        <View style={styles.placeholder} />
      )}
      <View style={styles.info}>
        <Text style={styles.title}>{item.titre}</Text>
        <Text style={styles.category}>{item.categorie}</Text>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString('fr-FR')}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.statut}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  placeholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  info: { flex: 1 },
  title: { ...typography.body, fontWeight: 'bold', color: colors.text.primary },
  category: { ...typography.caption, color: colors.text.secondary },
  date: { ...typography.caption, color: colors.text.secondary },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', ...typography.caption },
});
