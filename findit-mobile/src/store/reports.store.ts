import { create } from 'zustand';

export interface ReportSummary {
  id: string;
  type: 'lost' | 'found';
  titre: string;
  categorie: string;
  statut: string;
  adresse: string;
  latitude?: number;
  longitude?: number;
  distance_meters: number;
  first_photo_url: string | null;
  date_evenement: string;
  created_at: string;
  user: { nom: string; photo_url: string | null };
}

interface ReportsState {
  reports: ReportSummary[];
  setReports: (reports: ReportSummary[]) => void;
  appendReports: (reports: ReportSummary[]) => void;
  clearReports: () => void;
}

export const useReportsStore = create<ReportsState>((set) => ({
  reports: [],
  setReports: (reports) => set({ reports }),
  appendReports: (newReports) => set((state) => {
    // Avoid duplicates by checking ID
    const existingIds = new Set(state.reports.map(r => r.id));
    const uniqueNewReports = newReports.filter(r => !existingIds.has(r.id));
    return { reports: [...state.reports, ...uniqueNewReports] };
  }),
  clearReports: () => set({ reports: [] }),
}));
