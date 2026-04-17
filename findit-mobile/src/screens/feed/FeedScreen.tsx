import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/shared/Button';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { LoadingOverlay } from '../../components/shared/LoadingOverlay';
import { SkeletonBlock } from '../../components/shared/SkeletonBlock';
import { ReportCard } from '../../components/report/ReportCard';
import { colors, spacing, typography } from '../../constants/theme';
import { useFiltersStore } from '../../store/filters.store';
import { useInfiniteReports } from '../../hooks/useInfiniteReports';
import { useLocation } from '../../hooks/useLocation';
import { ROUTES } from '../../navigation/routes';
import type { FeedStackScreenProps } from '../../navigation/types';
import { FilterSheet } from './FilterSheet';

const LOCATION_FLAG_KEY = 'location_permission_asked';

function FeedSkeletonList() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <SkeletonBlock style={styles.skeletonImage} />
          <View style={styles.skeletonContent}>
            <SkeletonBlock style={styles.skeletonTitle} />
            <SkeletonBlock style={styles.skeletonMeta} />
            <SkeletonBlock style={styles.skeletonAddress} />
            <SkeletonBlock style={styles.skeletonStatus} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function FeedScreen({ navigation }: FeedStackScreenProps<typeof ROUTES.FEED_HOME>) {
  const filters = useFiltersStore();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [showLocationExplainer, setShowLocationExplainer] = useState(false);
  const location = useLocation();
  const { reports, isLoading, isLoadingMore, hasMore, error, loadMore, refresh } =
    useInfiniteReports();

  useEffect(() => {
    const checkFlag = async () => {
      try {
        const value = await AsyncStorage.getItem(LOCATION_FLAG_KEY);
        if (!value) {
          setShowLocationExplainer(true);
        }
      } catch {
        // ignore
      }
    };
    void checkFlag();
  }, []);

  const handleAskLocation = async () => {
    try {
      await AsyncStorage.setItem(LOCATION_FLAG_KEY, 'true');
    } catch {
      // ignore
    }
    setShowLocationExplainer(false);
    await location.requestPermission();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle} allowFontScaling minimumFontScale={0.9}>FindIt</Text>
      <Pressable
        style={styles.filterIconWrapper}
        onPress={() => setIsFilterSheetOpen(true)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Ouvrir les filtres"
        accessibilityHint="Personnaliser la liste des signalements"
      >
        <Ionicons name="options" size={22} color={colors.text.primary} />
        {filters.activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText} allowFontScaling minimumFontScale={0.9}>{filters.activeFiltersCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );

  const renderFooter = () =>
    isLoadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    ) : null;

  const listEmpty =
    !location.coords && !location.manualAddress
      ? 'Activez la géolocalisation ou renseignez une adresse pour voir les signalements proches.'
      : "Aucun signalement dans cette zone pour l'instant.";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderHeader()}

        {location.isLoading && <LoadingOverlay />}

        {error ? (
          <View style={styles.centered}>
            <ErrorMessage message={error} retryLabel="Réessayer" onRetry={refresh} />
          </View>
        ) : isLoading && reports.length === 0 ? (
          <FeedSkeletonList />
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ReportCard
                report={item}
                onPress={() => navigation.navigate(ROUTES.REPORT_DETAIL, { reportId: item.id })}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              reports.length === 0 && styles.listContentEmpty,
            ]}
            ListEmptyComponent={
              isLoading ? null : (
                <EmptyState
                  title="Aucun signalement"
                  description={listEmpty}
                  actionLabel={!location.coords && !location.manualAddress ? 'Activer la geolocalisation' : 'Actualiser'}
                  onAction={!location.coords && !location.manualAddress ? handleAskLocation : refresh}
                />
              )
            }
            ListFooterComponent={renderFooter}
            onEndReached={() => {
              if (hasMore && !isLoadingMore) {
                loadMore();
              }
            }}
            onEndReachedThreshold={0.7}
            refreshing={isLoading}
            onRefresh={refresh}
          />
        )}

        <View style={styles.filtersButtonWrapper}>
          <Button
            title="Filtres"
            variant="primary"
            onPress={() => setIsFilterSheetOpen(true)}
            containerStyle={styles.filtersButton}
          />
        </View>

        <FilterSheet visible={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} />

        <Modal transparent visible={showLocationExplainer} animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Activer la géolocalisation</Text>
              <Text style={styles.modalText} allowFontScaling minimumFontScale={0.9}>
                FindIt utilise votre position pour afficher les objets perdus et trouvés à proximité.
                Votre localisation est utilisée uniquement pour ce service.
              </Text>
              <View style={styles.modalButtons}>
                <Button
                  title="Plus tard"
                  variant="ghost"
                  containerStyle={styles.modalButton}
                  onPress={() => {
                    void AsyncStorage.setItem(LOCATION_FLAG_KEY, 'true');
                    setShowLocationExplainer(false);
                  }}
                />
                <Button
                  title="Autoriser"
                  variant="primary"
                  containerStyle={styles.modalButton}
                  onPress={handleAskLocation}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  filterIconWrapper: {
    padding: spacing.sm,
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontSize: 11,
  },
  listContent: {
    paddingBottom: spacing.xxl * 2,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    paddingTop: spacing.sm,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  skeletonImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  skeletonTitle: {
    width: '75%',
    height: 16,
  },
  skeletonMeta: {
    width: '58%',
    height: 12,
    marginTop: spacing.sm,
  },
  skeletonAddress: {
    width: '90%',
    height: 12,
    marginTop: spacing.sm,
  },
  skeletonStatus: {
    width: 68,
    height: 20,
    borderRadius: 10,
    marginTop: spacing.sm,
  },
  filtersButtonWrapper: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  filtersButton: {
    minWidth: 160,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  modalText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  modalButton: {
    marginLeft: spacing.sm,
  },
});

