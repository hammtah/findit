import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../../components/shared/Avatar';
import { StarRating } from '../../components/shared/StarRating';
import { useAuthStore } from '../../store/auth.store';
import { usersApi } from '../../api/users.api';
import { reportsApi } from '../../api/reports.api';
import { colors, spacing, typography } from '../../constants/theme';
import { HistoryItem } from '../../components/profile/HistoryItem';
import { ReviewItem } from '../../components/profile/ReviewItem';

export function ProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const logout = useAuthStore(s => s.logout);
  const [history, setHistory] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [historyTab, setHistoryTab] = useState<'lost' | 'found' | 'all'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const freshUser = await usersApi.me();
        updateUser(freshUser);
        const hist = await usersApi.getHistory(historyTab);
        setHistory(hist);
        const revs = await usersApi.getReviews(user.id);
        setReviews(revs);
      } catch {
        Alert.alert('Erreur', 'Impossible de charger le profil.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, historyTab]);

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Section 1 — Identité */}
      <View style={styles.identitySection}>
        <Avatar size={80} uri={user.photo_url} />
        <Text style={styles.name}>{user.nom}</Text>
        {user.note_fiabilite !== null ? (
          <View style={styles.row}>
            <StarRating value={user.note_fiabilite} />
            <Text style={styles.ratingLabel}>{user.note_fiabilite.toFixed(1)}</Text>
          </View>
        ) : (
          <Text style={styles.noteInfo}>Note disponible après 3 évaluations</Text>
        )}
        <Text style={styles.stats}>{user.nb_objets_resolus} objets résolus</Text>
        <Text style={styles.memberSince}>Membre depuis {new Date(user.date_inscription).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfileScreen' as never)}>
          <Text style={styles.editBtnText}>Modifier le profil</Text>
        </TouchableOpacity>
      </View>

      {/* Section 2 — Statistiques */}
      <View style={styles.statsSection}>
        <View style={styles.chip}><Text style={styles.chipText}>X perdus</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>Y trouvés</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>Z résolus</Text></View>
      </View>

      {/* Section 3 — Historique */}
      <View style={styles.historySection}>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setHistoryTab('lost')} style={[styles.tab, historyTab === 'lost' && styles.tabActive]}><Text>Perdus</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setHistoryTab('found')} style={[styles.tab, historyTab === 'found' && styles.tabActive]}><Text>Trouvés</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setHistoryTab('all')} style={[styles.tab, historyTab === 'all' && styles.tabActive]}><Text>Résolus</Text></TouchableOpacity>
        </View>
        <FlatList
          data={history}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => <HistoryItem item={item} onPress={() => (navigation.navigate as any)('ReportDetailScreen', { reportId: item.id })} />}
          scrollEnabled={false}
        />
      </View>

      {/* Section 4 — Évaluations reçues */}
      <View style={styles.reviewsSection}>
        <Text style={styles.sectionTitle}>Évaluations</Text>
        <View style={styles.row}>
          <StarRating value={user.note_fiabilite ?? 0} />
          <Text style={styles.ratingLabel}>{user.note_fiabilite !== null ? user.note_fiabilite.toFixed(1) : '-'}</Text>
          <Text style={styles.reviewCount}>{reviews.length} avis</Text>
        </View>
        {reviews.slice(0, 5).map(review => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </View>

      {/* Section 5 — Actions compte */}
      <View style={styles.actionsSection}>
        <Button title="Se déconnecter" onPress={() => logout()} />
        <Button title="Supprimer mon compte" color="red" onPress={() => Alert.alert('Êtes-vous sûr ?', 'Cette action est irréversible', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: async () => { await usersApi.deleteMe(); await logout(); } },
        ])} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  identitySection: { alignItems: 'center', marginBottom: spacing.lg },
  name: { ...typography.h2, color: colors.text.primary, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingLabel: { ...typography.body, marginLeft: spacing.xs },
  noteInfo: { ...typography.caption, color: colors.text.secondary, marginTop: spacing.xs },
  stats: { ...typography.body, color: colors.text.secondary, marginTop: spacing.xs },
  memberSince: { ...typography.caption, color: colors.text.secondary, marginTop: spacing.xs },
  editBtn: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: 8 },
  editBtnText: { color: '#fff', ...typography.body },
  statsSection: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg },
  chip: { backgroundColor: colors.background.secondary, borderRadius: 16, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipText: { ...typography.body, color: colors.text.primary },
  historySection: { marginBottom: spacing.lg },
  tabs: { flexDirection: 'row', marginBottom: spacing.sm },
  tab: { flex: 1, alignItems: 'center', padding: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  reviewsSection: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm },
  reviewCount: { ...typography.caption, color: colors.text.secondary, marginLeft: spacing.sm },
  actionsSection: { gap: spacing.sm, marginBottom: spacing.lg },
});
