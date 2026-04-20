import { useCallback, useEffect, useState } from 'react';
import { reportsApi } from '../api/reports.api';
import { useFiltersStore } from '../store/filters.store';
import { useReportsStore, ReportSummary } from '../store/reports.store';
import { useLocation } from './useLocation';

interface ReportsResponse {
  data: ReportSummary[];
  meta: {
    total: number;
    page: number;
    last_page: number;
  };
}

interface UseInfiniteReportsResult {
  reports: ReportSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
}

export function useInfiniteReports(): UseInfiniteReportsResult {
  const filters = useFiltersStore((state) => state);
  const location = useLocation();
  const { reports, setReports, appendReports } = useReportsStore();

  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean) => {
      if (!location.coords && !location.manualAddress) {
        return;
      }

      const params: Record<string, unknown> = {
        page: targetPage,
        radius: filters.radius,
        type: filters.type,
        statut: filters.statut,
        date_range: filters.dateRange,
        categorie: filters.categorie ?? undefined,
      };

      if (location.coords) {
        params.lat = location.coords.latitude;
        params.lng = location.coords.longitude;
      } else if (location.manualAddress) {
        params.manual_address = location.manualAddress;
      }

      try {
        const response = await reportsApi.getReports<ReportsResponse>(params);
        if (append) {
          appendReports(response.data);
        } else {
          setReports(response.data);
        }
        setPage(response.meta.page);
        setHasMore(response.meta.page < response.meta.last_page);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des signalements.');
      }
    },
    [
      filters.radius,
      filters.type,
      filters.statut,
      filters.dateRange,
      filters.categorie,
      location.coords,
      location.manualAddress,
      appendReports,
      setReports,
    ],
  );

  const refresh = useCallback(() => {
    setIsLoading(true);
    setHasMore(true);
    void fetchPage(1, false).finally(() => {
      setIsLoading(false);
    });
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    setIsLoadingMore(true);
    void fetchPage(page + 1, true).finally(() => {
      setIsLoadingMore(false);
    });
  }, [fetchPage, hasMore, isLoading, isLoadingMore, page]);

  useEffect(() => {
    if (!location.coords && !location.manualAddress && location.permissionStatus !== 'denied') {
      return;
    }
    
    // Only fetch if we don't have reports yet or if this is a filter/location change
    // This addresses the user's concern about redundant requests between Feed and Map
    if (reports.length === 0) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    location.coords?.latitude,
    location.coords?.longitude,
    location.manualAddress,
    filters.type,
    filters.radius,
    filters.categorie,
    filters.dateRange,
    filters.statut,
    location.permissionStatus,
  ]);

  return {
    reports,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}

