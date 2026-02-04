/**
 * Background Pre-loading Service
 * Starts loading critical data before authentication
 * Uses abort controllers to cancel in-flight requests when navigating
 */

import { fetchEmployeeDirectory } from './employeeDirectoryService';
import { loadComprehensiveMapping } from '../utils/mappingUtils';

// Abort controllers for cancellable requests
let employeeAbortController: AbortController | null = null;
let mappingAbortController: AbortController | null = null;
let dashboardAbortController: AbortController | null = null;

// Cache status
let preloadStatus = {
  employees: 'idle' as 'idle' | 'loading' | 'loaded' | 'error',
  mapping: 'idle' as 'idle' | 'loading' | 'loaded' | 'error',
  dashboard: 'idle' as 'idle' | 'loading' | 'loaded' | 'error'
};

/**
 * Start pre-loading critical resources in the background
 * This should be called on app mount, before authentication
 */
export async function startPreload() {
  console.log('🚀 [Preload Service] Starting background data preload...');

  // Priority 1: Store Mapping (needed for all dashboards)
  preloadMapping();

  // Priority 2: Employee Directory (needed for most features)
  preloadEmployees();
}

/**
 * Pre-load store mapping in background
 */
async function preloadMapping() {
  if (preloadStatus.mapping === 'loading' || preloadStatus.mapping === 'loaded') {
    return;
  }

  try {
    preloadStatus.mapping = 'loading';
    console.log('📊 [Preload] Loading Store Mapping...');
    
    await loadComprehensiveMapping();
    
    preloadStatus.mapping = 'loaded';
    console.log('✅ [Preload] Store Mapping loaded');
  } catch (error) {
    preloadStatus.mapping = 'error';
    console.error('❌ [Preload] Store Mapping failed:', error);
  }
}

/**
 * Pre-load employee directory in background
 */
async function preloadEmployees() {
  if (preloadStatus.employees === 'loading' || preloadStatus.employees === 'loaded') {
    return;
  }

  try {
    preloadStatus.employees = 'loading';
    console.log('👥 [Preload] Loading Employee Directory...');
    
    await fetchEmployeeDirectory();
    
    preloadStatus.employees = 'loaded';
    console.log('✅ [Preload] Employee Directory loaded');
  } catch (error) {
    preloadStatus.employees = 'error';
    console.error('❌ [Preload] Employee Directory failed:', error);
  }
}

/**
 * Cancel all in-flight preload requests
 */
export function cancelPreload() {
  if (employeeAbortController) {
    employeeAbortController.abort();
    employeeAbortController = null;
  }
  if (mappingAbortController) {
    mappingAbortController.abort();
    mappingAbortController = null;
  }
  if (dashboardAbortController) {
    dashboardAbortController.abort();
    dashboardAbortController = null;
  }
  console.log('🛑 [Preload Service] Cancelled all in-flight requests');
}

/**
 * Get current preload status
 */
export function getPreloadStatus() {
  return { ...preloadStatus };
}

/**
 * Reset preload status (useful for testing)
 */
export function resetPreloadStatus() {
  preloadStatus = {
    employees: 'idle',
    mapping: 'idle',
    dashboard: 'idle'
  };
}
