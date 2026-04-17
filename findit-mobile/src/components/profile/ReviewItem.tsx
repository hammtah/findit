import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../shared/Avatar';
import { StarRating } from '../shared/StarRating';
import { colors, spacing, typography } from '../../constants/theme';

interface ReviewItemProps {
  review: {
    id: string;
    auteur_nom: string;
    auteur_photo_url?: string | null;
    note: number;
    date: string;
    commentaire?: string | null;
    anonymise?: boolean;
  };
}

export function ReviewItem({ review }: ReviewItemProps) {
  return (
    <View style={styles.container}>
      <Avatar size={36} uri={review.auteur_photo_url} />
      <View style={styles.info}>
        <Text style={styles.name}>{review.anonymise ? 'Utilisateur' : review.auteur_nom}</Text>
        <View style={styles.row}>
          <StarRating value={review.note} />
          <Text style={styles.date}>{new Date(review.date).toLocaleDateString('fr-FR')}</Text>
        </View>
        {review.commentaire ? (
          <Text style={styles.comment}>{review.commentaire}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  info: { flex: 1 },
  name: { ...typography.body, fontWeight: 'bold', color: colors.text.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { ...typography.caption, color: colors.text.secondary, marginLeft: spacing.sm },
  comment: { ...typography.body, color: colors.text.secondary, marginTop: spacing.xs },
});
