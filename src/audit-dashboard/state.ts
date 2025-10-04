/**
 * AUDIT DASHBOARD STATE MANAGEMENT
 * 
 * Global state using Zustand following the canonical spec.
 * Single source of truth for filters, selection, and navigation.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Type definitions matching the spec
export type ViewType = 
  | 'DASHBOARD' 
  | 'REGION' 
  | 'TRAINER' 
  | 'SECTION' 
  | 'DISTRIBUTION' 
  | 'STORE' 
  | 'QUESTION' 
  | 'HEALTH';

export interface Filters {
  regionId: string | null;
  areaManagerId: string | null;
  storeId: string | null;
  hrId: string | null;
  trainerId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export interface Selection {
  regionId: string | null;
  storeId: string | null;
  trainerId: string | null;
  sectionKey: string | null;
  scoreRange: string | null;
  questionId: string | null;
}

export interface AppState {
  filters: Filters;
  selection: Selection;
  view: ViewType;
  breadcrumbs: Array<{ label: string; view: ViewType; params?: Record<string, any> }>;
}

interface AppActions {
  // Navigation actions
  navigate: (to: ViewType, params?: Record<string, any>) => void;
  
  // Filter actions
  setFilter: (key: keyof Filters, value: string | null) => void;
  clearFilters: () => void;
  
  // Selection actions
  setSelection: (key: keyof Selection, value: string | null) => void;
  clearSelection: () => void;
  
  // Breadcrumb helpers
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; view: ViewType; params?: Record<string, any> }>) => void;
}

type StoreState = AppState & AppActions;

// Initial state matching the spec
const initialState: AppState = {
  filters: {
    regionId: null,
    areaManagerId: null,
    storeId: null,
    hrId: null,
    trainerId: null,
    dateFrom: null,
    dateTo: null,
  },
  selection: {
    regionId: null,
    storeId: null,
    trainerId: null,
    sectionKey: null,
    scoreRange: null,
    questionId: null,
  },
  view: 'DASHBOARD',
  breadcrumbs: [{ label: 'Dashboard', view: 'DASHBOARD' }],
};

// Navigation reducer following the spec
function buildBreadcrumbs(view: ViewType, params: Record<string, any> = {}): Array<{ label: string; view: ViewType; params?: Record<string, any> }> {
  const breadcrumbs: Array<{ label: string; view: ViewType; params?: Record<string, any> }> = [{ label: 'Dashboard', view: 'DASHBOARD' as ViewType }];
  
  switch (view) {
    case 'DASHBOARD':
      return breadcrumbs;
      
    case 'REGION':
      breadcrumbs.push({ 
        label: `Region: ${params.regionId || 'Unknown'}`, 
        view: 'REGION', 
        params: { regionId: params.regionId } 
      });
      break;
      
    case 'TRAINER':
      breadcrumbs.push({ 
        label: `Trainer: ${params.trainerName || params.trainerId || 'Unknown'}`, 
        view: 'TRAINER', 
        params: { trainerId: params.trainerId } 
      });
      break;
      
    case 'SECTION':
      breadcrumbs.push({ 
        label: `Section: ${params.sectionKey || 'Unknown'}`, 
        view: 'SECTION', 
        params: { sectionKey: params.sectionKey } 
      });
      break;
      
    case 'DISTRIBUTION':
      breadcrumbs.push({ 
        label: `Score Range: ${params.scoreRange || 'Unknown'}`, 
        view: 'DISTRIBUTION', 
        params: { scoreRange: params.scoreRange } 
      });
      break;
      
    case 'STORE':
      // Build drill chain if coming from region or trainer
      if (params.regionId) {
        breadcrumbs.push({ 
          label: `Region: ${params.regionId}`, 
          view: 'REGION', 
          params: { regionId: params.regionId } 
        });
      }
      if (params.trainerId) {
        breadcrumbs.push({ 
          label: `Trainer: ${params.trainerName || params.trainerId}`, 
          view: 'TRAINER', 
          params: { trainerId: params.trainerId } 
        });
      }
      breadcrumbs.push({ 
        label: `Store: ${params.storeName || params.storeId || 'Unknown'}`, 
        view: 'STORE', 
        params: { storeId: params.storeId } 
      });
      break;
      
    case 'QUESTION':
      // Build full drill chain
      if (params.sectionKey) {
        breadcrumbs.push({ 
          label: `Section: ${params.sectionKey}`, 
          view: 'SECTION', 
          params: { sectionKey: params.sectionKey } 
        });
      }
      breadcrumbs.push({ 
        label: `Question: ${params.questionId || 'Unknown'}`, 
        view: 'QUESTION', 
        params: { questionId: params.questionId } 
      });
      break;
      
    case 'HEALTH':
      if (params.storeId) {
        breadcrumbs.push({ 
          label: `Store: ${params.storeId}`, 
          view: 'STORE', 
          params: { storeId: params.storeId } 
        });
      }
      breadcrumbs.push({ 
        label: 'Health Status', 
        view: 'HEALTH', 
        params: params.storeId ? { storeId: params.storeId } : {} 
      });
      break;
  }
  
  return breadcrumbs;
}

// Zustand store with devtools
export const useAuditStore = create<StoreState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Navigation reducer (deterministic; easy to wire)
      navigate: (to: ViewType, params: Record<string, any> = {}) => {
        const state = get();
        
        // Update selection based on navigation params
        const newSelection: Selection = {
          regionId: params.regionId ?? null,
          storeId: params.storeId ?? null,
          trainerId: params.trainerId ?? null,
          sectionKey: params.sectionKey ?? null,
          scoreRange: params.scoreRange ?? null,
          questionId: params.questionId ?? null,
        };

        // Build breadcrumbs for the new view
        const breadcrumbs = buildBreadcrumbs(to, params);

        set({
          view: to,
          selection: newSelection,
          breadcrumbs,
        }, false, `navigate to ${to}`);

        // Trigger data loading (handled by components)
        console.log(`Navigation: ${to}`, { params, filters: state.filters, selection: newSelection });
      },

      // Filter management
      setFilter: (key: keyof Filters, value: string | null) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
          },
        }), false, `setFilter ${key}=${value}`);
      },

      clearFilters: () => {
        set({
          filters: { ...initialState.filters },
        }, false, 'clearFilters');
      },

      // Selection management
      setSelection: (key: keyof Selection, value: string | null) => {
        set((state) => ({
          selection: {
            ...state.selection,
            [key]: value,
          },
        }), false, `setSelection ${key}=${value}`);
      },

      clearSelection: () => {
        set({
          selection: { ...initialState.selection },
        }, false, 'clearSelection');
      },

      // Breadcrumb management
      setBreadcrumbs: (breadcrumbs) => {
        set({ breadcrumbs }, false, 'setBreadcrumbs');
      },
    }),
    {
      name: 'audit-dashboard-store',
    }
  )
);

// Navigation helper functions
export const navigationActions = {
  // Event handlers matching the spec click→action mapping
  
  // Filter clicks
  handleRegionFilterClick: (regionId: string) => {
    const { setFilter, clearSelection, navigate } = useAuditStore.getState();
    setFilter('regionId', regionId);
    clearSelection();
    navigate('DASHBOARD');
  },

  handleAreaManagerFilterClick: (areaManagerId: string) => {
    const { setFilter, navigate } = useAuditStore.getState();
    setFilter('areaManagerId', areaManagerId);
    navigate('DASHBOARD');
  },

  handleStoreFilterClick: (storeId: string) => {
    const { setFilter, navigate } = useAuditStore.getState();
    setFilter('storeId', storeId);
    navigate('STORE', { storeId });
  },

  handleHrFilterClick: (hrId: string) => {
    const { setFilter, navigate } = useAuditStore.getState();
    setFilter('hrId', hrId);
    navigate('DASHBOARD');
  },

  handleTrainerFilterClick: (trainerId: string) => {
    const { setFilter, navigate } = useAuditStore.getState();
    setFilter('trainerId', trainerId);
    navigate('TRAINER', { trainerId });
  },

  // Chart clicks
  handleRegionPerfClick: (regionId: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('REGION', { regionId });
  },

  handleTopTrainerClick: (trainerId: string, trainerName?: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('TRAINER', { trainerId, trainerName });
  },

  handleSectionPerfClick: (sectionKey: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('SECTION', { sectionKey });
  },

  handleScoreDistribClick: (scoreRange: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('DISTRIBUTION', { scoreRange });
  },

  handleAvgByTrainerClick: (trainerId: string, trainerName?: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('TRAINER', { trainerId, trainerName });
  },

  handleStorePerfClick: (storeId: string, storeName?: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('STORE', { storeId, storeName });
  },

  handleRadarPerfClick: (sectionKey: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('SECTION', { sectionKey });
  },

  handleStoreHealthClick: (storeId?: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('HEALTH', storeId ? { storeId } : {});
  },

  // Secondary drill events from detail views
  handleRegionStoreClick: (storeId: string, storeName?: string, regionId?: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('STORE', { storeId, storeName, regionId });
  },

  handleTrainerAuditStoreClick: (storeId: string, storeName?: string, trainerId?: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('STORE', { storeId, storeName, trainerId });
  },

  handleTrainerSectionClick: (sectionKey: string, trainerId?: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('SECTION', { sectionKey, trainerId });
  },

  handleSectionQuestionClick: (questionId: string, sectionKey?: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('QUESTION', { questionId, sectionKey });
  },

  handleStoreSectionClick: (sectionKey: string, storeId?: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('SECTION', { sectionKey, storeId });
  },

  handleStoreQuestionClick: (questionId: string, storeId?: string, sectionKey?: string) => {
    const { navigate } = useAuditStore.getState();
    navigate('QUESTION', { questionId, storeId, sectionKey });
  },
};

// Export hooks for components
export const useFilters = () => useAuditStore((state) => state.filters);
export const useSelection = () => useAuditStore((state) => state.selection);
export const useCurrentView = () => useAuditStore((state) => state.view);
export const useBreadcrumbs = () => useAuditStore((state) => state.breadcrumbs);
export const useNavigate = () => useAuditStore((state) => state.navigate);
export const useSetFilter = () => useAuditStore((state) => state.setFilter);