import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { conversationsApi } from '../../api/conversations.api';
import { flagsApi } from '../../api/flags.api';
import { reportsApi } from '../../api/reports.api';
import { MatchCard } from '../../components/report/MatchCard';
import { Avatar } from '../../components/shared/Avatar';
import { Badge } from '../../components/shared/Badge';
import { Button } from '../../components/shared/Button';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { SkeletonBlock } from '../../components/shared/SkeletonBlock';
import { StarRating } from '../../components/shared/StarRating';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { ROUTES } from '../../navigation/routes';
import { useAuthStore } from '../../store/auth.store';
import { handleApiError } from '../../utils/handleApiError';
import { formatDate } from '../../utils/formatDate';

type FlagMotif =
  | 'faux_signalement'
  | 'contenu_inapproprie'
  | 'arnaque'
  | 'autre';

interface MatchItem {
  id: string;
  score: number;
  report_found: {
    id: string;
    titre: string;
    adresse: string;
    first_photo_url: string | null;
  };
  distance_meters: number | null;
}

interface ReportDetailResponse {
  id: string;
  type: 'lost' | 'found';
  titre: string;
  description: string;
  categorie: string;
  statut: 'en_attente' | 'resolu' | 'rendu';
  adresse: string;
  photos: string[];
  date_evenement: string;
  heure_evenement: string | null;
  created_at: string;
  user: {
    id: string;
    nom: string;
    photo_url: string | null;
    note_fiabilite: number | null;
  };
  matches: MatchItem[];
  my_conversation_id: string | null;
}

const FLAG_OPTIONS: Array<{ value: FlagMotif; label: string }> = [
  { value: 'faux_signalement', label: 'Faux signalement' },
  { value: 'contenu_inapproprie', label: 'Contenu inapproprié' },
  { value: 'arnaque', label: "Tentative d'arnaque" },
  { value: 'autre', label: 'Autre' },
];

export function ReportDetailScreen({ route, navigation }: any) {
  const { reportId } = route.params as { reportId: string };
  const currentUser = useAuthStore((state) => state.user);

  const [report, setReport] = useState<ReportDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [selectedMotif, setSelectedMotif] = useState<FlagMotif>('faux_signalement');
  const [flagDescription, setFlagDescription] = useState('');
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getReport<ReportDetailResponse>(reportId);
      setReport(response);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const isOwner = useMemo(
    () => Boolean(report && currentUser && report.user.id === currentUser.id),
    [currentUser, report],
  );

  const formattedEventDate = useMemo(() => {
    if (!report) return '';
    const label = new Date(report.date_evenement).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return report.heure_evenement ? `${label} à ${report.heure_evenement}` : label;
  }, [report]);

  const typeTone = report?.type === 'found' ? 'success' : 'danger';
  const typeLabel = report?.type === 'found' ? 'TROUVÉ' : 'PERDU';
  const statusTone =
    report?.statut === 'en_attente' ? 'default' : 'success';
  const statusLabel =
    report?.statut === 'resolu'
      ? 'Résolu'
      : report?.statut === 'rendu'
      ? 'Rendu'
      : 'En attente';

  const handleStartConversation = async () => {
    if (!report) return;

    if (report.my_conversation_id) {
      navigation.navigate(ROUTES.CONVERSATIONS);
      return;
    }

    if (report.type !== 'lost' || report.matches.length === 0) {
      Alert.alert(
        'Conversation indisponible',
        "Aucune correspondance exploitable n'est disponible pour ouvrir une conversation depuis cet écran.",
      );
      return;
    }

    const firstMatch = report.matches[0];
    setActionLoading('contact');
    try {
      await conversationsApi.createConversation({
        report_lost_id: report.id,
        report_found_id: firstMatch.report_found.id,
      });
      Alert.alert('Demande envoyée', 'La conversation a bien été créée.');
      navigation.navigate(ROUTES.CONVERSATIONS);
      await loadReport();
    } catch (err) {
      Alert.alert('Erreur', handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async () => {
    if (!report) return;
    const nextStatus = report.type === 'lost' ? 'resolu' : 'rendu';
    const confirmLabel = report.type === 'lost' ? 'résolu' : 'rendu';

    Alert.alert(
      'Confirmer',
      `Marquer ce signalement comme ${confirmLabel} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setActionLoading('status');
            try {
              await reportsApi.updateReportStatus(report.id, { statut: nextStatus });
              await loadReport();
            } catch (err) {
              Alert.alert('Erreur', handleApiError(err));
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleDelete = async () => {
    if (!report) return;

    Alert.alert(
      'Supprimer le signalement',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('delete');
            try {
              await reportsApi.deleteReport(report.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Erreur', handleApiError(err));
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const submitFlag = async () => {
    if (!report) return;

    setIsSubmittingFlag(true);
    try {
      await flagsApi.createFlag({
        target_type: 'report',
        target_id: report.id,
        motif: selectedMotif,
        description: flagDescription.trim() || undefined,
      });
      setIsFlagModalOpen(false);
      setFlagDescription('');
      setSelectedMotif('faux_signalement');
      Alert.alert('Signalement envoyé', 'Merci pour votre retour.');
    } catch (err) {
      Alert.alert('Erreur', handleApiError(err));
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.skeletonRoot}>
        <SkeletonBlock style={styles.skeletonGallery} />
        <View style={styles.skeletonSection}>
          <SkeletonBlock style={styles.skeletonBadgeRow} />
          <SkeletonBlock style={styles.skeletonMainTitle} />
          <SkeletonBlock style={styles.skeletonLineLong} />
          <SkeletonBlock style={styles.skeletonLineLong} />
          <SkeletonBlock style={styles.skeletonParagraph} />
        </View>
        <View style={styles.skeletonSection}>
          <SkeletonBlock style={styles.skeletonSectionTitle} />
          <SkeletonBlock style={styles.skeletonUserCard} />
        </View>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.centered}>
        {error ? (
          <ErrorMessage message={error} retryLabel="Réessayer" onRetry={loadReport} />
        ) : (
          <EmptyState title="Signalement introuvable" actionLabel="Retour" onAction={() => navigation.goBack()} />
        )}
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.gallerySection}>
          {report.photos.length > 0 ? (
            <>
              <FlatList
                data={report.photos}
                horizontal
                pagingEnabled
                keyExtractor={(item, index) => `${item}-${index}`}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const width = event.nativeEvent.layoutMeasurement.width;
                  const offset = event.nativeEvent.contentOffset.x;
                  setActivePhotoIndex(Math.round(offset / width));
                }}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.galleryImage} contentFit="cover" />
                )}
              />
              <View style={styles.dotsRow}>
                {report.photos.map((photo, index) => (
                  <View
                    key={`${photo}-${index}`}
                    style={[styles.dot, index === activePhotoIndex && styles.dotActive]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon} allowFontScaling={false}>📦</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.badgesRow}>
            <Badge label={typeLabel} tone={typeTone} />
            <Badge label={report.categorie} tone="primary" />
            <Badge label={statusLabel} tone={statusTone} />
          </View>

          <Text style={styles.title} allowFontScaling minimumFontScale={0.9}>{report.titre}</Text>
          <Text style={styles.metaText} allowFontScaling minimumFontScale={0.9}>📍 {report.adresse}</Text>
          <Text style={styles.metaText} allowFontScaling minimumFontScale={0.9}>📅 {formattedEventDate}</Text>

          <Text
            style={styles.description}
            numberOfLines={expandedDescription ? undefined : 3}
            allowFontScaling
            minimumFontScale={0.9}
          >
            {report.description}
          </Text>
          {report.description.length > 180 ? (
            <Pressable
              onPress={() => setExpandedDescription((value) => !value)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={expandedDescription ? 'Voir moins la description' : 'Voir plus la description'}
            >
              <Text style={styles.linkText} allowFontScaling minimumFontScale={0.9}>
                {expandedDescription ? 'Voir moins' : 'Voir plus'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling minimumFontScale={0.9}>Auteur</Text>
          <Pressable
            style={styles.userCard}
            onPress={() => navigation.navigate(ROUTES.USER_PUBLIC_PROFILE, { userId: report.user.id })}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Profil public de ${report.user.nom}`}
            accessibilityHint="Ouvrir le profil de l'auteur"
          >
            <Avatar uri={report.user.photo_url} name={report.user.nom} size={48} />
            <View style={styles.userInfo}>
              <Text style={styles.userName} allowFontScaling minimumFontScale={0.9}>{report.user.nom}</Text>
              <View style={styles.userMetaRow}>
                {report.user.note_fiabilite !== null ? (
                  <StarRating value={report.user.note_fiabilite} />
                ) : null}
                <Text style={styles.userMetaText} allowFontScaling minimumFontScale={0.9}>Publié {formatDate(report.created_at)}</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {report.type === 'lost' && report.matches.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} allowFontScaling minimumFontScale={0.9}>Objets trouvés similaires</Text>
            <FlatList
              data={report.matches.slice(0, 5)}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <MatchCard
                  match={item}
                  onPress={() =>
                    navigation.push(ROUTES.REPORT_DETAIL, {
                      reportId: item.report_found.id,
                    })
                  }
                />
              )}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle} allowFontScaling minimumFontScale={0.9}>Actions</Text>
          {isOwner ? (
            <>
              <Button
                title="Modifier"
                variant="secondary"
                containerStyle={styles.actionButton}
                onPress={() =>
                  navigation.navigate(ROUTES.CREATE_REPORT, {
                    reportId: report.id,
                  })
                }
              />
              <Button
                title={
                  actionLoading === 'status'
                    ? 'Mise à jour...'
                    : report.type === 'lost'
                    ? 'Marquer comme résolu'
                    : 'Marquer comme rendu'
                }
                variant="primary"
                containerStyle={styles.actionButton}
                onPress={handleUpdateStatus}
                disabled={actionLoading !== null}
              />
              <Button
                title={actionLoading === 'delete' ? 'Suppression...' : 'Supprimer'}
                variant="danger"
                containerStyle={styles.actionButton}
                onPress={handleDelete}
                disabled={actionLoading !== null}
              />
            </>
          ) : (
            <>
              <Button
                title={actionLoading === 'contact' ? 'Envoi...' : 'Contacter'}
                variant="primary"
                containerStyle={styles.actionButton}
                onPress={handleStartConversation}
                disabled={actionLoading !== null}
              />
              <Button
                title="Signaler"
                variant="ghost"
                containerStyle={styles.actionButton}
                onPress={() => setIsFlagModalOpen(true)}
                disabled={actionLoading !== null}
              />
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="slide"
        visible={isFlagModalOpen}
        onRequestClose={() => setIsFlagModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalFlex} onPress={() => setIsFlagModalOpen(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle} allowFontScaling minimumFontScale={0.9}>Signaler ce contenu</Text>
            {FLAG_OPTIONS.map((option) => {
              const selected = selectedMotif === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={styles.radioRow}
                  onPress={() => setSelectedMotif(option.value)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={styles.radioLabel} allowFontScaling minimumFontScale={0.9}>{option.label}</Text>
                </Pressable>
              );
            })}

            <TextInput
              style={styles.textarea}
              placeholder="Détails complémentaires (optionnel)"
              placeholderTextColor={colors.text.muted}
              value={flagDescription}
              onChangeText={(value) => setFlagDescription(value.slice(0, 300))}
              multiline
              textAlignVertical="top"
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="Description du signalement"
              accessibilityHint="Ajouter des details facultatifs"
            />
            <Text style={styles.counter} allowFontScaling minimumFontScale={0.9}>{flagDescription.length}/300</Text>

            <View style={styles.modalActions}>
              <Button
                title="Annuler"
                variant="ghost"
                containerStyle={styles.modalActionButton}
                onPress={() => setIsFlagModalOpen(false)}
              />
              <Button
                title={isSubmittingFlag ? 'Envoi...' : 'Envoyer'}
                variant="danger"
                containerStyle={styles.modalActionButton}
                onPress={submitFlag}
                disabled={isSubmittingFlag}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  skeletonRoot: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  skeletonGallery: {
    width: '100%',
    height: 292,
    borderRadius: 0,
  },
  skeletonSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  skeletonBadgeRow: {
    width: 170,
    height: 22,
  },
  skeletonMainTitle: {
    width: '82%',
    height: 28,
    marginTop: spacing.md,
  },
  skeletonLineLong: {
    width: '95%',
    height: 14,
    marginTop: spacing.sm,
  },
  skeletonParagraph: {
    width: '100%',
    height: 70,
    marginTop: spacing.md,
  },
  skeletonSectionTitle: {
    width: 100,
    height: 18,
    marginBottom: spacing.md,
  },
  skeletonUserCard: {
    width: '100%',
    height: 76,
  },
  gallerySection: {
    backgroundColor: colors.background.secondary,
  },
  galleryImage: {
    width: 390,
    height: 292,
    backgroundColor: colors.background.secondary,
  },
  photoPlaceholder: {
    height: 292,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  photoPlaceholderIcon: {
    fontSize: 48,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.muted,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  metaText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.primary,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  linkText: {
    ...typography.label,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    ...typography.label,
    color: colors.text.primary,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  userMetaText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalFlex: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  textarea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  counter: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  modalActionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});
