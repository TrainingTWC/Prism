/**
 * TestSprite Configuration for Prism Dashboard
 * Comprehensive testing setup for React Training Dashboard
 */

export default {
  // Project Information
  name: "Prism Training Dashboard",
  description: "Training audit dashboard with multi-role filtering and analytics",
  version: "1.0.0",
  
  // Test Environment Configuration
  environment: {
    baseUrl: "http://localhost:5173", // Vite dev server default
    framework: "React",
    language: "TypeScript",
    buildTool: "Vite",
    testFramework: "TestSprite"
  },

  // Core Components to Test
  components: [
    {
      name: "Dashboard",
      path: "components/Dashboard.tsx",
      type: "page",
      priority: "high",
      features: [
        "Multi-dashboard switching (HR, Operations, Training, QA)",
        "Role-based access control",
        "Filter interactions",
        "Data visualization",
        "PDF export functionality",
        "Modal interactions"
      ]
    },
    {
      name: "DashboardFilters",
      path: "components/DashboardFilters.tsx",
      type: "component",
      priority: "high",
      features: [
        "Searchable dropdowns",
        "Cascading filter logic",
        "Mobile responsive drawer",
        "Filter reset functionality",
        "Real-time data filtering"
      ]
    },
    {
      name: "AuditScoreDetailsModal",
      path: "components/AuditScoreDetailsModal.tsx",
      type: "modal",
      priority: "high",
      features: [
        "Historical audit data display",
        "Filter-aware data loading",
        "Store mapping integration",
        "Health categorization",
        "Responsive table layout"
      ]
    },
    {
      name: "StatCard",
      path: "components/StatCard.tsx",
      type: "component",
      priority: "medium",
      features: [
        "Clickable audit percentage",
        "Trend indicators",
        "Dynamic color coding",
        "Responsive layout"
      ]
    },
    {
      name: "HistoricTrendsSection",
      path: "src/components/dashboard/HistoricTrendsSection.tsx",
      type: "component",
      priority: "medium",
      features: [
        "Collapsible section",
        "Google Sheets integration",
        "Animated gradient background",
        "Performance data visualization"
      ]
    },
    {
      name: "TrainingDetailModal",
      path: "components/TrainingDetailModal.tsx",
      type: "modal",
      priority: "medium",
      features: [
        "Training submission details",
        "Section-based filtering",
        "Audit navigation integration",
        "Mobile gesture support"
      ]
    }
  ],

  // User Roles and Permissions
  userRoles: [
    {
      name: "admin",
      permissions: ["all-dashboards", "all-regions", "export", "manage-users"],
      testScenarios: ["Full access verification", "Cross-dashboard navigation"]
    },
    {
      name: "area_manager",
      permissions: ["training-dashboard", "operations-dashboard", "assigned-stores"],
      testScenarios: ["Store-specific filtering", "AM operations access"]
    },
    {
      name: "trainer",
      permissions: ["training-dashboard", "assigned-stores", "audit-creation"],
      testScenarios: ["Training audit workflows", "Store assignment validation"]
    },
    {
      name: "store",
      permissions: ["single-store-view", "audit-submission"],
      testScenarios: ["Store-level restrictions", "Audit form completion"]
    }
  ],

  // Test Data Configuration
  testData: {
    stores: [
      { id: "S001", name: "Koramangala", region: "South", am: "H1355" },
      { id: "S002", name: "CMH Indira Nagar", region: "South", am: "H546" },
      { id: "S003", name: "HSR-1", region: "South", am: "H3270" }
    ],
    trainers: [
      { id: "H1761", name: "Mahadev Nayak" },
      { id: "H701", name: "Mallika M" },
      { id: "H1697", name: "Sheldon Antonio Xavier DSouza" }
    ],
    regions: ["North", "South", "East", "West"],
    auditData: {
      sampleSubmissions: 50,
      scoreRange: [45, 95],
      timeRange: "2025-07 to 2025-10"
    }
  },

  // Critical User Workflows
  workflows: [
    {
      name: "training_audit_submission",
      description: "Complete training audit from start to finish",
      steps: [
        "Navigate to training checklist",
        "Select store",
        "Fill required sections",
        "Submit audit",
        "Verify dashboard update"
      ],
      expectedOutcome: "Audit appears in dashboard with correct data",
      priority: "critical"
    },
    {
      name: "filter_and_export",
      description: "Apply filters and export filtered data",
      steps: [
        "Open dashboard",
        "Apply region filter",
        "Apply trainer filter",
        "Verify filtered results",
        "Export PDF report"
      ],
      expectedOutcome: "PDF contains only filtered data",
      priority: "high"
    },
    {
      name: "modal_interactions",
      description: "Test all modal interactions and data loading",
      steps: [
        "Click Audit Percentage stat",
        "Verify modal opens with data",
        "Apply filters in modal",
        "Test modal close/open",
        "Check responsive behavior"
      ],
      expectedOutcome: "Modal behaves correctly across devices",
      priority: "high"
    },
    {
      name: "role_based_access",
      description: "Verify role-based data restrictions",
      steps: [
        "Login as store user",
        "Verify limited store access",
        "Login as area manager",
        "Verify AM-level access",
        "Login as admin",
        "Verify full access"
      ],
      expectedOutcome: "Each role sees appropriate data only",
      priority: "critical"
    }
  ],

  // Performance Benchmarks
  performance: {
    pageLoad: {
      target: "< 3 seconds",
      critical: "< 5 seconds"
    },
    filterResponse: {
      target: "< 500ms",
      critical: "< 1 second"
    },
    modalOpen: {
      target: "< 300ms",
      critical: "< 800ms"
    },
    dataVisualization: {
      target: "< 1 second",
      critical: "< 2 seconds"
    }
  },

  // Browser and Device Coverage
  browserSupport: [
    "Chrome (latest 2 versions)",
    "Firefox (latest 2 versions)",
    "Safari (latest 2 versions)",
    "Edge (latest 2 versions)"
  ],
  deviceCategories: [
    "Desktop (1920x1080, 1366x768)",
    "Tablet (768x1024, 1024x768)",
    "Mobile (375x667, 414x896)"
  ],

  // Integration Points
  integrations: [
    {
      name: "Google Sheets API",
      endpoint: "Monthly_Trends sheet",
      testType: "api_mock",
      scenarios: ["Data loading", "Error handling", "Rate limiting"]
    },
    {
      name: "Store Mapping",
      source: "public/comprehensive_store_mapping.json",
      testType: "data_validation",
      scenarios: ["Mapping accuracy", "Missing stores", "Role filtering"]
    }
  ],

  // Accessibility Requirements
  accessibility: {
    standards: ["WCAG 2.1 AA"],
    features: [
      "Keyboard navigation",
      "Screen reader compatibility",
      "Color contrast compliance",
      "Focus management",
      "Alternative text for charts"
    ]
  },

  // Security Test Points
  security: [
    "Role-based data access",
    "API key handling",
    "Client-side data filtering",
    "Cross-role data leakage prevention"
  ]
};