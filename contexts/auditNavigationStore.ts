import { create } from 'zustand';

interface AuditNavigationState {
  selectedRegion: string | null;
  selectedTrainer: string | null;
  selectedSection: string | null;
  selectedScoreRange: string | null;
  selectedStore: string | null;
  setSelectedRegion: (region: string | null) => void;
  setSelectedTrainer: (trainer: string | null) => void;
  setSelectedSection: (section: string | null) => void;
  setSelectedScoreRange: (range: string | null) => void;
  setSelectedStore: (store: string | null) => void;
  clearAllFilters: () => void;
}

export const useAuditNavigation = create<AuditNavigationState>((set) => ({
  selectedRegion: null,
  selectedTrainer: null,
  selectedSection: null,
  selectedScoreRange: null,
  selectedStore: null,
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setSelectedTrainer: (trainer) => set({ selectedTrainer: trainer }),
  setSelectedSection: (section) => set({ selectedSection: section }),
  setSelectedScoreRange: (range) => set({ selectedScoreRange: range }),
  setSelectedStore: (store) => set({ selectedStore: store }),
  clearAllFilters: () => set({
    selectedRegion: null,
    selectedTrainer: null,
    selectedSection: null,
    selectedScoreRange: null,
    selectedStore: null,
  }),
}));