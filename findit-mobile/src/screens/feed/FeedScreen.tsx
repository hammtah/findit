import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '../../components/shared/Button';
import { EmptyState } from '../../components/shared/EmptyState';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { LoadingOverlay } from '../../components/shared/LoadingOverlay';
import { ReportCard } from '../../components/report/ReportCard';
import { colors, spacing, typography } from '../../constants/theme';
import { useFiltersStore } from '../../store/filters.store';
import { useInfiniteReports } from '../../hooks/useInfiniteReports';
import { useLocation } from '../../hooks/useLocation';
import { ROUTES } from '../../navigation/routes';
import type { FeedStackScreenProps } from '../../navigation/types';
import { FilterSheet } from './FilterSheet';

const LOCATION_FLAG_KEY = 'location_permission_asked';

export function FeedScreen({ navigation }: FeedStackScreenProps<typeof ROUTES.FEED>) {
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
      <Text style={styles.headerTitle}>FindIt</Text>
      <Pressable style={styles.filterIconWrapper} onPress={() => setIsFilterSheetOpen(true)}>
        <Ionicons name="options" size={22} color={colors.text.primary} />
        {filters.activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{filters.activeFiltersCount}</Text>
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
            <ErrorMessage message={error} />
            <Button
              title="Réessayer"
              variant="secondary"
              containerStyle={styles.retryButton}
              onPress={refresh}
            />
          </View>
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
              <Text style={styles.modalText}>
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

