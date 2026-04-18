import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Type = 'lost' | 'found' | 'all';
type Radius = 1000 | 5000 | 10000 | 25000 | 50000;
type DateRange = 'today' | '7days' | '30days' | 'all';
type Statut = 'en_attente' | 'resolu' | 'rendu' | 'all';

interface BaseFilters {
  type: Type;
  radius: Radius;
  categorie: string | null;
  dateRange: DateRange;
  statut: Statut;
}

interface FiltersState extends BaseFilters {
  activeFiltersCount: number;
  setFilters: (partial: Partial<BaseFilters>) => void;
  resetFilters: () => void;
}

const defaults: BaseFilters = {
  type: 'all',
  radius: 50000,
  categorie: null,
  dateRange: 'all',
  statut: 'all',
};

const getCount = (f: BaseFilters) =>
  Number(f.type !== defaults.type) +
  Number(f.radius !== defaults.radius) +
  Number(f.categorie !== defaults.categorie) +
  Number(f.dateRange !== defaults.dateRange) +
  Number(f.statut !== defaults.statut);

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      ...defaults,
      activeFiltersCount: 0,
      setFilters: (partial) =>
        set((state) => {
          const next = { ...state, ...partial };
          return { ...partial, activeFiltersCount: getCount(next) };
        }),
      resetFilters: () => set({ ...defaults, activeFiltersCount: 0 }),
    }),
    {
      name: 'findit-filters-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        type: state.type,
        radius: state.radius,
        categorie: state.categorie,
        dateRange: state.dateRange,
        statut: state.statut,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.activeFiltersCount = getCount(state);
      },
    },
  ),
);
