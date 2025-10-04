/**
 * DATA SERVICES
 * 
 * Mock functions that match the spec API contracts.
 * These simulate backend endpoints for the audit dashboard.
 */

import {
  AuditRow,
  QuestionResult,
  Summary,
  RegionData,
  TrainerData,
  SectionData,
  StoreByRegion,
  TrendData,
  TrainerProfile,
  WeakSection,
  QuestionBreakdown,
  WeakStore,
  WeakTrainer,
  EntitiesInRange,
  StoreSummary,
  CriticalFail,
  AuditNote,
  QuestionDetail,
  Evidence,
  RelatedEntities,
  HealthCard,
  ApiFilters
} from '../types';

// Mock data generators
function generateAuditRows(count: number = 50): AuditRow[] {
  const regions = ['R001', 'R002', 'R003', 'R004'];
  const stores = Array.from({length: 20}, (_, i) => `S${String(i + 1).padStart(3, '0')}`);
  const trainers = ['T001', 'T002', 'T003', 'T004', 'T005'];
  const trainerNames = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'Tom Brown'];
  const sections = ['buddy_training', 'action_plan', 'product_knowledge', 'customer_service'];

  return Array.from({length: count}, (_, i) => {
    const score = Math.floor(Math.random() * 40) + 60; // 60-100 range
    return {
      auditId: `A${String(i + 1).padStart(3, '0')}`,
      storeId: stores[Math.floor(Math.random() * stores.length)],
      storeName: `Store ${Math.floor(Math.random() * 999) + 1}`,
      regionId: regions[Math.floor(Math.random() * regions.length)],
      areaManagerId: `AM${Math.floor(Math.random() * 5) + 1}`,
      trainerId: trainers[Math.floor(Math.random() * trainers.length)],
      trainerName: trainerNames[Math.floor(Math.random() * trainerNames.length)],
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      scorePct: score,
      sectionScores: sections.reduce((acc, section) => {
        acc[section] = Math.floor(Math.random() * 40) + 60;
        return acc;
      }, {} as Record<string, number>)
    };
  });
}

const mockAudits = generateAuditRows();

// API Functions matching spec contracts
export async function fetchSummary(filters: ApiFilters): Promise<Summary> {
  const filteredAudits = filterAudits(mockAudits, filters);
  const avgScore = filteredAudits.reduce((sum, audit) => sum + audit.scorePct, 0) / filteredAudits.length;
  
  return {
    totalAudits: filteredAudits.length,
    avgScorePct: Math.round(avgScore * 100) / 100,
    storesCovered: new Set(filteredAudits.map(a => a.storeId)).size
  };
}

export async function fetchRegionData(filters: ApiFilters): Promise<RegionData[]> {
  const filteredAudits = filterAudits(mockAudits, filters);
  const regionMap = new Map<string, AuditRow[]>();
  
  filteredAudits.forEach(audit => {
    if (!regionMap.has(audit.regionId)) {
      regionMap.set(audit.regionId, []);
    }
    regionMap.get(audit.regionId)!.push(audit);
  });

  return Array.from(regionMap.entries()).map(([regionId, audits]) => ({
    regionId,
    name: `Region ${regionId}`,
    avgScorePct: Math.round((audits.reduce((sum, a) => sum + a.scorePct, 0) / audits.length) * 100) / 100,
    audits: audits.length
  }));
}

export async function fetchTrainerData(filters: ApiFilters): Promise<TrainerData[]> {
  const filteredAudits = filterAudits(mockAudits, filters);
  const trainerMap = new Map<string, AuditRow[]>();
  
  filteredAudits.forEach(audit => {
    if (!trainerMap.has(audit.trainerId)) {
      trainerMap.set(audit.trainerId, []);
    }
    trainerMap.get(audit.trainerId)!.push(audit);
  });

  return Array.from(trainerMap.entries()).map(([trainerId, audits]) => ({
    trainerId,
    name: audits[0].trainerName,
    avgScorePct: Math.round((audits.reduce((sum, a) => sum + a.scorePct, 0) / audits.length) * 100) / 100,
    audits: audits.length,
    stores: new Set(audits.map(a => a.storeId)).size
  }));
}

export async function fetchSectionData(filters: ApiFilters): Promise<SectionData[]> {
  const sections = ['buddy_training', 'action_plan', 'product_knowledge', 'customer_service'];
  const sectionLabels = {
    buddy_training: 'Buddy Training',
    action_plan: 'Action Plan',
    product_knowledge: 'Product Knowledge',
    customer_service: 'Customer Service'
  };

  return sections.map(sectionKey => ({
    sectionKey,
    label: sectionLabels[sectionKey as keyof typeof sectionLabels],
    avgScorePct: Math.floor(Math.random() * 25) + 70,
    questionsCount: Math.floor(Math.random() * 10) + 5,
    responsesCount: Math.floor(Math.random() * 100) + 50
  }));
}

export async function fetchStoresByRegion(regionId: string, filters: ApiFilters): Promise<StoreByRegion[]> {
  const filteredAudits = filterAudits(mockAudits, { ...filters, regionId });
  const storeMap = new Map<string, AuditRow[]>();
  
  filteredAudits.forEach(audit => {
    if (!storeMap.has(audit.storeId)) {
      storeMap.set(audit.storeId, []);
    }
    storeMap.get(audit.storeId)!.push(audit);
  });

  return Array.from(storeMap.entries()).map(([storeId, audits]) => {
    const latestAudit = audits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return {
      storeId,
      name: audits[0].storeName,
      avgScorePct: Math.round((audits.reduce((sum, a) => sum + a.scorePct, 0) / audits.length) * 100) / 100,
      audits: audits.length,
      trainerName: latestAudit.trainerName,
      lastAuditDate: latestAudit.date
    };
  });
}

export async function fetchTrendData(filters: ApiFilters): Promise<TrendData[]> {
  const days = 30;
  return Array.from({length: days}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    return {
      date: date.toISOString().split('T')[0],
      avgScorePct: Math.floor(Math.random() * 20) + 75
    };
  });
}

export async function fetchTrainerProfile(trainerId: string): Promise<TrainerProfile> {
  return {
    name: `Trainer ${trainerId}`,
    tenureMonths: Math.floor(Math.random() * 36) + 6,
    storesHandled: Math.floor(Math.random() * 15) + 5
  };
}

export async function fetchWeakSections(filters: ApiFilters): Promise<WeakSection[]> {
  const sections = ['buddy_training', 'action_plan', 'product_knowledge', 'customer_service'];
  return sections.map(sectionKey => ({
    sectionKey,
    avgScorePct: Math.floor(Math.random() * 30) + 45
  })).sort((a, b) => a.avgScorePct - b.avgScorePct);
}

export async function fetchQuestionBreakdown(sectionKey: string, filters: ApiFilters): Promise<QuestionBreakdown[]> {
  const questionCount = Math.floor(Math.random() * 8) + 3;
  return Array.from({length: questionCount}, (_, i) => ({
    questionId: `Q${sectionKey}_${i + 1}`,
    label: `Question ${i + 1} for ${sectionKey}`,
    passRatePct: Math.floor(Math.random() * 40) + 55
  }));
}

export async function fetchWeakStores(filters: ApiFilters): Promise<WeakStore[]> {
  const filteredAudits = filterAudits(mockAudits, filters);
  const storeMap = new Map<string, AuditRow[]>();
  
  filteredAudits.forEach(audit => {
    if (!storeMap.has(audit.storeId)) {
      storeMap.set(audit.storeId, []);
    }
    storeMap.get(audit.storeId)!.push(audit);
  });

  return Array.from(storeMap.entries())
    .map(([storeId, audits]) => ({
      storeId,
      name: audits[0].storeName,
      avgScorePct: Math.round((audits.reduce((sum, a) => sum + a.scorePct, 0) / audits.length) * 100) / 100
    }))
    .sort((a, b) => a.avgScorePct - b.avgScorePct)
    .slice(0, 10);
}

export async function fetchWeakTrainers(filters: ApiFilters): Promise<WeakTrainer[]> {
  const trainerData = await fetchTrainerData(filters);
  return trainerData
    .sort((a, b) => a.avgScorePct - b.avgScorePct)
    .slice(0, 10);
}

export async function fetchEntitiesInRange(minScore: number, maxScore: number, filters: ApiFilters): Promise<EntitiesInRange> {
  const filteredAudits = filterAudits(mockAudits, filters)
    .filter(audit => audit.scorePct >= minScore && audit.scorePct <= maxScore);

  const storeMap = new Map<string, AuditRow[]>();
  const trainerMap = new Map<string, AuditRow[]>();

  filteredAudits.forEach(audit => {
    if (!storeMap.has(audit.storeId)) {
      storeMap.set(audit.storeId, []);
    }
    storeMap.get(audit.storeId)!.push(audit);

    if (!trainerMap.has(audit.trainerId)) {
      trainerMap.set(audit.trainerId, []);
    }
    trainerMap.get(audit.trainerId)!.push(audit);
  });

  return {
    stores: Array.from(storeMap.entries()).map(([storeId, audits]) => ({
      storeId,
      name: audits[0].storeName,
      avgScorePct: Math.round((audits.reduce((sum, a) => sum + a.scorePct, 0) / audits.length) * 100) / 100,
      audits: audits.length
    })),
    trainers: Array.from(trainerMap.entries()).map(([trainerId, audits]) => ({
      trainerId,
      name: audits[0].trainerName,
      avgScorePct: Math.round((audits.reduce((sum, a) => sum + a.scorePct, 0) / audits.length) * 100) / 100,
      audits: audits.length
    })),
    audits: filteredAudits
  };
}

export async function fetchStoreSummary(storeId: string): Promise<StoreSummary> {
  const storeAudits = mockAudits.filter(audit => audit.storeId === storeId);
  const latestAudit = storeAudits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  return {
    storeId,
    name: latestAudit.storeName,
    regionId: latestAudit.regionId,
    areaManagerId: latestAudit.areaManagerId,
    trainerName: latestAudit.trainerName,
    avgScorePct: Math.round((storeAudits.reduce((sum, a) => sum + a.scorePct, 0) / storeAudits.length) * 100) / 100
  };
}

export async function fetchCriticalFails(storeId: string): Promise<CriticalFail[]> {
  return [
    { questionId: 'Q001', label: 'Safety protocols check', latestStatus: 'Failed' },
    { questionId: 'Q015', label: 'Customer greeting standards', latestStatus: 'Passed' },
    { questionId: 'Q023', label: 'Product placement accuracy', latestStatus: 'Failed' }
  ];
}

export async function fetchAuditNotes(storeId: string): Promise<AuditNote[]> {
  return Array.from({length: 3}, (_, i) => ({
    auditId: `A${String(i + 1).padStart(3, '0')}`,
    date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    author: `Auditor ${i + 1}`,
    comment: `Sample audit comment ${i + 1} for store ${storeId}`
  }));
}

export async function fetchQuestionDetail(questionId: string): Promise<QuestionDetail> {
  return {
    label: `Question ${questionId} - Sample question text`,
    sectionKey: 'buddy_training',
    orgPassRatePct: Math.floor(Math.random() * 30) + 65
  };
}

export async function fetchEvidence(questionId: string, filters: ApiFilters): Promise<Evidence[]> {
  const filteredAudits = filterAudits(mockAudits, filters);
  return filteredAudits.slice(0, 10).map(audit => ({
    auditId: audit.auditId,
    storeId: audit.storeId,
    storeName: audit.storeName,
    trainerName: audit.trainerName,
    passed: Math.random() > 0.3,
    comment: `Sample evidence comment for ${questionId}`,
    photoUrl: Math.random() > 0.5 ? 'https://via.placeholder.com/300x200' : undefined,
    timestamp: audit.date
  }));
}

export async function fetchRelatedEntities(questionId: string): Promise<RelatedEntities> {
  return {
    stores: Array.from({length: 5}, (_, i) => ({
      storeId: `S${String(i + 1).padStart(3, '0')}`,
      name: `Store ${i + 1}`,
      avgScorePct: Math.floor(Math.random() * 30) + 60
    })),
    trainers: Array.from({length: 3}, (_, i) => ({
      trainerId: `T${String(i + 1).padStart(3, '0')}`,
      name: `Trainer ${i + 1}`,
      avgScorePct: Math.floor(Math.random() * 30) + 65
    }))
  };
}

export async function fetchHealthCards(filters: ApiFilters): Promise<HealthCard[]> {
  const stores = ['S001', 'S002', 'S003', 'S004', 'S005'];
  return stores.map(storeId => ({
    scope: 'store' as const,
    status: (['Healthy', 'Needs Attention', 'Critical'] as const)[Math.floor(Math.random() * 3)],
    lastAudit: {
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      scorePct: Math.floor(Math.random() * 40) + 60,
      trainerName: `Trainer ${Math.floor(Math.random() * 5) + 1}`
    },
    nextDue: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : null,
    sections: [
      {
        sectionKey: 'buddy_training',
        status: 'Good',
        color: 'green',
        scorePct: Math.floor(Math.random() * 20) + 80
      },
      {
        sectionKey: 'action_plan',
        status: 'Needs Work',
        color: 'orange',
        scorePct: Math.floor(Math.random() * 20) + 60
      }
    ]
  }));
}

// Helper function to filter audits based on API filters
function filterAudits(audits: AuditRow[], filters: ApiFilters): AuditRow[] {
  return audits.filter(audit => {
    if (filters.regionId && audit.regionId !== filters.regionId) return false;
    if (filters.areaManagerId && audit.areaManagerId !== filters.areaManagerId) return false;
    if (filters.storeId && audit.storeId !== filters.storeId) return false;
    if (filters.trainerId && audit.trainerId !== filters.trainerId) return false;
    if (filters.dateFrom && new Date(audit.date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(audit.date) > new Date(filters.dateTo)) return false;
    return true;
  });
}