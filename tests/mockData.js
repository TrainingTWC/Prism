/**
 * Mock Data and API Responses for TestSprite
 * Provides realistic test data that matches the actual dashboard structure
 */

export const mockStoreMapping = [
  {
    "Store ID": "S001",
    "Store Name": "Koramangala",
    "Region": "South", 
    "AM": "H1355",
    "Trainer": "H1761",
    "HRBP": "H2761"
  },
  {
    "Store ID": "S002", 
    "Store Name": "CMH Indira Nagar",
    "Region": "South",
    "AM": "H546", 
    "Trainer": "H1761",
    "HRBP": "H1972"
  },
  {
    "Store ID": "S003",
    "Store Name": "HSR-1", 
    "Region": "South",
    "AM": "H3270",
    "Trainer": "H701",
    "HRBP": "H1972"
  },
  {
    "Store ID": "S153",
    "Store Name": "Lajpat Nagar",
    "Region": "North",
    "AM": "H1766", 
    "Trainer": "H2595",
    "HRBP": "H3578"
  }
];

export const mockTrainingData = [
  {
    id: "audit_001",
    storeId: "S001",
    storeName: "Koramangala",
    region: "South",
    amId: "H1355",
    trainerId: "H1761",
    trainerName: "Mahadev Nayak",
    percentageScore: "89",
    totalScore: 76,
    timestamp: "2025-07-15T10:30:00Z",
    sections: {
      "TSA Food": { score: 8, maxScore: 10 },
      "TSA Coffee": { score: 9, maxScore: 10 },
      "Customer Service": { score: 7, maxScore: 10 }
    }
  },
  {
    id: "audit_002", 
    storeId: "S001",
    storeName: "Koramangala",
    region: "South",
    amId: "H1355", 
    trainerId: "H1761",
    trainerName: "Mahadev Nayak",
    percentageScore: "94",
    totalScore: 84,
    timestamp: "2025-08-15T10:30:00Z",
    sections: {
      "TSA Food": { score: 9, maxScore: 10 },
      "TSA Coffee": { score: 9, maxScore: 10 },
      "Customer Service": { score: 8, maxScore: 10 }
    }
  },
  {
    id: "audit_003",
    storeId: "S002",
    storeName: "CMH Indira Nagar", 
    region: "South",
    amId: "H546",
    trainerId: "H1761",
    trainerName: "Mahadev Nayak",
    percentageScore: "58",
    totalScore: 54,
    timestamp: "2025-07-20T14:15:00Z",
    sections: {
      "TSA Food": { score: 5, maxScore: 10 },
      "TSA Coffee": { score: 6, maxScore: 10 },
      "Customer Service": { score: 5, maxScore: 10 }
    }
  }
];

export const mockTrendsData = [
  {
    store_id: "S001",
    store_name: "Koramangala", 
    metric_name: "percentage",
    metric_value: "89",
    observed_period: "2025-07",
    auditor_id: "h1761",
    am_id: "H1355",
    region: "South"
  },
  {
    store_id: "S001",
    store_name: "Koramangala",
    metric_name: "percentage", 
    metric_value: "94",
    observed_period: "2025-08",
    auditor_id: "h1761",
    am_id: "H1355", 
    region: "South"
  },
  {
    store_id: "S001",
    store_name: "Koramangala",
    metric_name: "percentage",
    metric_value: "74", 
    observed_period: "2025-09",
    auditor_id: "h1761",
    am_id: "H1355",
    region: "South"
  }
];

export const mockUserRoles = {
  admin: {
    role: "admin",
    permissions: ["all"],
    storeAccess: "all",
    regionAccess: "all"
  },
  area_manager_south: {
    role: "area_manager", 
    permissions: ["training-dashboard", "operations-dashboard"],
    storeAccess: ["S001", "S002", "S003"],
    regionAccess: ["South"],
    amId: "H1355"
  },
  trainer_mahadev: {
    role: "trainer",
    permissions: ["training-dashboard"],
    storeAccess: ["S001", "S002"],
    regionAccess: ["South"],
    trainerId: "H1761"
  },
  store_koramangala: {
    role: "store",
    permissions: ["training-dashboard"],
    storeAccess: ["S001"],
    regionAccess: [],
    storeId: "S001"
  }
};

export const mockApiResponses = {
  "/api/training-data": {
    method: "GET",
    response: mockTrainingData,
    delay: 800 // Simulate API delay
  },
  "/api/store-mapping": {
    method: "GET", 
    response: mockStoreMapping,
    delay: 200
  },
  "/api/trends-data": {
    method: "GET",
    response: mockTrendsData,
    delay: 1200
  },
  "/api/user-permissions": {
    method: "GET",
    response: (userId) => mockUserRoles[userId] || mockUserRoles.store_koramangala,
    delay: 300
  }
};

export const testDataGeneration = {
  generateAuditSubmission: (overrides = {}) => ({
    id: `audit_${Date.now()}`,
    storeId: "S001",
    storeName: "Test Store",
    region: "South", 
    amId: "H1355",
    trainerId: "H1761",
    trainerName: "Test Trainer",
    percentageScore: String(Math.floor(Math.random() * 40) + 55), // 55-95
    totalScore: Math.floor(Math.random() * 40) + 55,
    timestamp: new Date().toISOString(),
    sections: {
      "TSA Food": { score: Math.floor(Math.random() * 3) + 7, maxScore: 10 },
      "TSA Coffee": { score: Math.floor(Math.random() * 3) + 7, maxScore: 10 },
      "Customer Service": { score: Math.floor(Math.random() * 3) + 7, maxScore: 10 }
    },
    ...overrides
  }),

  generateLargeDataset: (count = 100) => {
    const stores = ["S001", "S002", "S003", "S153"];
    const trainers = ["H1761", "H701", "H2595"];
    const regions = ["South", "North"];
    
    return Array.from({ length: count }, (_, i) => 
      testDataGeneration.generateAuditSubmission({
        id: `audit_${i}`,
        storeId: stores[i % stores.length],
        trainerId: trainers[i % trainers.length],
        region: regions[i % regions.length]
      })
    );
  }
};

export const errorScenarios = {
  apiTimeout: {
    "/api/training-data": {
      error: "timeout",
      delay: 10000
    }
  },
  apiError: {
    "/api/training-data": {
      error: "500",
      message: "Internal Server Error"
    }
  },
  emptyData: {
    "/api/training-data": {
      response: [],
      delay: 200
    }
  },
  malformedData: {
    "/api/training-data": {
      response: [
        { 
          // Missing required fields
          storeId: "S001"
          // percentageScore missing
          // trainerId missing
        }
      ],
      delay: 200
    }
  }
};

export const performanceTestData = {
  largeDataset: testDataGeneration.generateLargeDataset(1000),
  complexFilters: {
    region: "South",
    trainer: "H1761", 
    store: "S001",
    health: "Perfect Shot"
  },
  heavyChartData: Array.from({ length: 50 }, (_, i) => ({
    month: `2024-${String(i % 12 + 1).padStart(2, '0')}`,
    score: Math.floor(Math.random() * 40) + 55,
    audits: Math.floor(Math.random() * 20) + 5
  }))
};

export default {
  mockStoreMapping,
  mockTrainingData,
  mockTrendsData,
  mockUserRoles,
  mockApiResponses,
  testDataGeneration,
  errorScenarios,
  performanceTestData
};