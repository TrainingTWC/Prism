/**
 * DATA CONTRACTS AND TYPES
 * 
 * Type definitions matching the spec data contracts.
 * Used for TypeScript validation and API consistency.
 */

// Core entities
export interface AuditRow {
  auditId: string;
  storeId: string;
  storeName: string;
  regionId: string;
  areaManagerId: string;
  trainerId: string;
  trainerName: string;
  date: string;            // ISO
  scorePct: number;        // 0-100
  sectionScores: Record<string, number>;  // e.g., {"buddy_training": 50, "action_plan": 67, ...}
}

export interface QuestionResult {
  auditId: string;
  questionId: string;
  sectionKey: string;
  passed: boolean;
  comment?: string;
  photoUrl?: string;
  timestamp: string;
}

// Aggregation result types
export interface Summary {
  totalAudits: number;
  avgScorePct: number;
  storesCovered: number;
}

export interface RegionData {
  regionId: string;
  name: string;
  avgScorePct: number;
  audits: number;
}

export interface TrainerData {
  trainerId: string;
  name: string;
  avgScorePct: number;
  audits: number;
  stores: number;
}

export interface SectionData {
  sectionKey: string;
  label: string;
  avgScorePct: number;
  questionsCount: number;
  responsesCount: number;
}

export interface StoreByRegion {
  storeId: string;
  name: string;
  avgScorePct: number;
  audits: number;
  trainerName: string;
  lastAuditDate: string;
}

export interface TrendData {
  date: string;
  avgScorePct: number;
}

export interface TrainerProfile {
  name: string;
  tenureMonths: number;
  storesHandled: number;
}

export interface WeakSection {
  sectionKey: string;
  avgScorePct: number;
}

export interface QuestionBreakdown {
  questionId: string;
  label: string;
  passRatePct: number;
}

export interface WeakStore {
  storeId: string;
  name: string;
  avgScorePct: number;
}

export interface WeakTrainer {
  trainerId: string;
  name: string;
  avgScorePct: number;
}

export interface EntitiesInRange {
  stores: Array<{
    storeId: string;
    name: string;
    avgScorePct: number;
    audits: number;
  }>;
  trainers: Array<{
    trainerId: string;
    name: string;
    avgScorePct: number;
    audits: number;
  }>;
  audits: AuditRow[];
}

export interface StoreSummary {
  storeId: string;
  name: string;
  regionId: string;
  areaManagerId: string;
  trainerName: string;
  avgScorePct: number;
}

export interface CriticalFail {
  questionId: string;
  label: string;
  latestStatus: string;
}

export interface AuditNote {
  auditId: string;
  date: string;
  author: string;
  comment: string;
}

export interface QuestionDetail {
  label: string;
  sectionKey: string;
  orgPassRatePct: number;
}

export interface Evidence {
  auditId: string;
  storeId: string;
  storeName: string;
  trainerName: string;
  passed: boolean;
  comment: string;
  photoUrl?: string;
  timestamp: string;
}

export interface RelatedEntities {
  stores: Array<{ storeId: string; name: string; avgScorePct: number }>;
  trainers: Array<{ trainerId: string; name: string; avgScorePct: number }>;
}

export interface HealthCard {
  scope: "store" | "multi";
  status: "Healthy" | "Needs Attention" | "Critical";
  lastAudit: {
    date: string;
    scorePct: number;
    trainerName: string;
  };
  nextDue: string | null;
  sections: Array<{
    sectionKey: string;
    status: string;
    color: string;
    scorePct: number;
  }>;
}

// Filter interface for API calls
export interface ApiFilters {
  regionId?: string | null;
  areaManagerId?: string | null;
  storeId?: string | null;
  hrId?: string | null;
  trainerId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}