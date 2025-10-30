/**
 * TestSprite Workflow Tests for Prism Dashboard
 * End-to-end user journey testing
 */

import { mockUserRoles, mockTrainingData, testDataGeneration } from './mockData.js';

export const workflowTests = [
  {
    id: "WF-001",
    name: "Complete Training Audit Workflow",
    description: "Test the complete flow from audit creation to dashboard visualization",
    priority: "critical",
    estimatedDuration: "5 minutes",
    setup: {
      user: mockUserRoles.trainer_mahadev,
      initialData: mockTrainingData.slice(0, 2), // Some existing data
      mockResponses: ["training-audit-success"]
    },
    steps: [
      {
        id: "step-1",
        description: "Navigate to Training Checklist",
        action: "navigate",
        target: "/training-checklist",
        expected: "Training checklist page loads",
        assertions: [
          "page.title contains 'Training Audit'",
          "form[data-testid='audit-form'] is visible"
        ]
      },
      {
        id: "step-2", 
        description: "Select store for audit",
        action: "select",
        target: "[data-testid='store-select']",
        value: "S001",
        expected: "Store selection updates form context",
        assertions: [
          "selected store displays as 'Koramangala'",
          "form sections become enabled"
        ]
      },
      {
        id: "step-3",
        description: "Fill TSA Food section",
        action: "fill_section",
        target: "[data-testid='tsa-food-section']",
        values: {
          "food-quality": "yes",
          "food-presentation": "yes", 
          "food-safety": "no",
          "remarks": "Food safety protocols need improvement"
        },
        expected: "Section completion status updates",
        assertions: [
          "section progress bar shows completion",
          "required field indicators update"
        ]
      },
      {
        id: "step-4",
        description: "Fill Customer Service section",
        action: "fill_section",
        target: "[data-testid='customer-service-section']", 
        values: {
          "greeting": "yes",
          "acknowledgment": "yes",
          "product-knowledge": "yes"
        },
        expected: "All required sections completed",
        assertions: [
          "submit button becomes enabled",
          "form validation passes"
        ]
      },
      {
        id: "step-5",
        description: "Submit completed audit",
        action: "click",
        target: "[data-testid='submit-audit']",
        expected: "Audit submission succeeds",
        assertions: [
          "success message appears",
          "form resets for next audit",
          "loading indicator disappears"
        ]
      },
      {
        id: "step-6",
        description: "Navigate to dashboard to verify data",
        action: "navigate", 
        target: "/dashboard",
        expected: "Dashboard shows updated data",
        assertions: [
          "total submissions count increased",
          "new audit appears in recent audits",
          "store score reflects new submission"
        ]
      },
      {
        id: "step-7",
        description: "Verify audit in Audit Details modal",
        action: "click",
        target: "[data-testid='audit-percentage-card']",
        expected: "Modal opens with new audit data",
        assertions: [
          "modal displays recent audit",
          "store shows updated latest score",
          "audit count is correct"
        ]
      }
    ],
    teardown: {
      cleanup: ["reset audit forms", "clear session storage"],
      dataReset: true
    },
    successCriteria: [
      "Audit submitted without errors",
      "Dashboard reflects new data immediately", 
      "All score calculations are correct",
      "Modal shows updated information"
    ]
  },

  {
    id: "WF-002",
    name: "Filter and Export Workflow",
    description: "Test filtering data and exporting filtered results",
    priority: "high",
    estimatedDuration: "3 minutes",
    setup: {
      user: mockUserRoles.area_manager_south,
      initialData: testDataGeneration.generateLargeDataset(50),
      mockResponses: ["export-pdf-success"]
    },
    steps: [
      {
        id: "step-1",
        description: "Open dashboard with full data",
        action: "navigate",
        target: "/dashboard",
        expected: "Dashboard loads with all accessible data",
        assertions: [
          "data table shows multiple stores",
          "all filter options are available"
        ]
      },
      {
        id: "step-2",
        description: "Apply region filter",
        action: "select",
        target: "[data-testid='region-filter']",
        value: "South",
        expected: "Data filters to South region only",
        assertions: [
          "store filter options update to South stores",
          "data table shows only South region data",
          "stat cards update to reflect filtered data"
        ]
      },
      {
        id: "step-3", 
        description: "Apply trainer filter",
        action: "select",
        target: "[data-testid='trainer-filter']",
        value: "H1761",
        expected: "Further filters data to specific trainer",
        assertions: [
          "data table shows only H1761 audits",
          "AM filter updates to show relevant AMs",
          "audit count decreases appropriately"
        ]
      },
      {
        id: "step-4",
        description: "Verify filter results in modal",
        action: "click",
        target: "[data-testid='audit-percentage-card']",
        expected: "Modal respects applied filters",
        assertions: [
          "modal shows only filtered stores",
          "audit count matches filtered results",
          "no unfiltered data appears"
        ]
      },
      {
        id: "step-5",
        description: "Export filtered data",
        action: "click",
        target: "[data-testid='download-report']",
        expected: "PDF export begins",
        assertions: [
          "download progress indicator appears",
          "export button shows loading state"
        ]
      },
      {
        id: "step-6",
        description: "Verify PDF content",
        action: "verify_download",
        target: "generated_pdf",
        expected: "PDF contains only filtered data",
        assertions: [
          "PDF title includes filter information",
          "PDF data matches dashboard filtered view",
          "no unfiltered records in PDF"
        ]
      }
    ],
    successCriteria: [
      "Filters cascade correctly",
      "Data updates in real-time",
      "Modal respects filters",
      "PDF export contains accurate filtered data"
    ]
  },

  {
    id: "WF-003",
    name: "Role-Based Access Validation",
    description: "Verify different user roles see appropriate data and features", 
    priority: "critical",
    estimatedDuration: "4 minutes",
    setup: {
      initialData: testDataGeneration.generateLargeDataset(30),
      multiUser: true
    },
    steps: [
      {
        id: "step-1",
        description: "Login as store-level user",
        action: "login",
        user: mockUserRoles.store_koramangala,
        expected: "Store user session established",
        assertions: [
          "user role indicator shows 'Store'",
          "navigation shows limited options"
        ]
      },
      {
        id: "step-2",
        description: "Verify store user restrictions",
        action: "navigate",
        target: "/dashboard",
        expected: "Dashboard shows only user's store data",
        assertions: [
          "store filter is disabled/preset to S001",
          "all data rows show storeId: S001",
          "region filter is hidden/disabled",
          "trainer filter shows only assigned trainer"
        ]
      },
      {
        id: "step-3",
        description: "Test modal access for store user",
        action: "click", 
        target: "[data-testid='audit-percentage-card']",
        expected: "Modal shows only store-specific data",
        assertions: [
          "modal shows only S001 audits",
          "no other store data is visible",
          "audit count matches store submissions"
        ]
      },
      {
        id: "step-4",
        description: "Switch to area manager user",
        action: "login",
        user: mockUserRoles.area_manager_south,
        expected: "Area manager session established",
        assertions: [
          "user role indicator shows 'Area Manager'",
          "expanded navigation options available"
        ]
      },
      {
        id: "step-5",
        description: "Verify area manager access",
        action: "navigate",
        target: "/dashboard", 
        expected: "Dashboard shows AM's assigned stores",
        assertions: [
          "store filter shows multiple South region stores",
          "data includes multiple stores (S001, S002, S003)",
          "region filter defaults to South",
          "trainer filter shows all South region trainers"
        ]
      },
      {
        id: "step-6",
        description: "Test admin access",
        action: "login",
        user: mockUserRoles.admin,
        expected: "Full admin access granted",
        assertions: [
          "all dashboard types are accessible",
          "all regions available in filters",
          "export functionality is available",
          "user management options visible"
        ]
      }
    ],
    successCriteria: [
      "Each role sees only authorized data",
      "No data leakage between roles",
      "UI adapts to role permissions",
      "Filter options respect role boundaries"
    ]
  },

  {
    id: "WF-004",
    name: "Error Handling and Recovery",
    description: "Test system behavior under error conditions",
    priority: "medium",
    estimatedDuration: "3 minutes",
    setup: {
      user: mockUserRoles.trainer_mahadev,
      mockErrors: ["api-timeout", "network-error"]
    },
    steps: [
      {
        id: "step-1",
        description: "Navigate to dashboard with API timeout",
        action: "navigate",
        target: "/dashboard",
        mockCondition: "api-timeout",
        expected: "Graceful loading state handling",
        assertions: [
          "loading indicator appears",
          "timeout message displays after 5 seconds",
          "retry button is available"
        ]
      },
      {
        id: "step-2",
        description: "Test retry functionality",
        action: "click",
        target: "[data-testid='retry-button']",
        expected: "Data reload attempt",
        assertions: [
          "loading state reappears",
          "retry counter increments",
          "user can still navigate to other sections"
        ]
      },
      {
        id: "step-3",
        description: "Test with network error during export",
        action: "click",
        target: "[data-testid='download-report']",
        mockCondition: "network-error",
        expected: "Export error handling",
        assertions: [
          "error notification appears",
          "user can retry export",
          "dashboard remains functional"
        ]
      },
      {
        id: "step-4",
        description: "Test partial data loading",
        action: "navigate",
        target: "/dashboard",
        mockCondition: "partial-data-load",
        expected: "System works with available data", 
        assertions: [
          "available data displays correctly",
          "missing data sections show appropriate placeholders",
          "user is informed of partial load"
        ]
      }
    ],
    successCriteria: [
      "No crashes under error conditions",
      "Clear error messages for users",
      "Graceful degradation with partial data",
      "Recovery mechanisms work"
    ]
  },

  {
    id: "WF-005",
    name: "Mobile Responsive Workflow",
    description: "Test complete workflow on mobile devices",
    priority: "medium",
    estimatedDuration: "4 minutes",
    setup: {
      user: mockUserRoles.trainer_mahadev,
      initialData: mockTrainingData,
      deviceConfig: {
        viewport: "375x667",
        userAgent: "mobile",
        touchEnabled: true
      }
    },
    steps: [
      {
        id: "step-1",
        description: "Open dashboard on mobile",
        action: "navigate",
        target: "/dashboard",
        expected: "Mobile-optimized layout loads",
        assertions: [
          "compact mobile layout is active",
          "filter drawer button is visible",
          "charts are mobile-responsive"
        ]
      },
      {
        id: "step-2",
        description: "Test mobile filter interaction",
        action: "tap",
        target: "[data-testid='mobile-filter-button']",
        expected: "Filter drawer opens",
        assertions: [
          "drawer slides in from right",
          "backdrop overlay appears",
          "all filter options are accessible"
        ]
      },
      {
        id: "step-3",
        description: "Apply filters in mobile drawer",
        action: "select",
        target: "[data-testid='mobile-region-filter']",
        value: "South",
        expected: "Filters apply and drawer can close",
        assertions: [
          "filter selection is visible",
          "apply button becomes enabled",
          "drawer can be closed with swipe or tap"
        ]
      },
      {
        id: "step-4",
        description: "Test mobile modal interaction",
        action: "tap",
        target: "[data-testid='audit-percentage-card']",
        expected: "Modal opens in mobile view",
        assertions: [
          "modal takes full screen on mobile",
          "close button is easily accessible",
          "content is scrollable"
        ]
      },
      {
        id: "step-5",
        description: "Test mobile gesture support",
        action: "swipe",
        target: "[data-testid='audit-modal']",
        direction: "right",
        expected: "Modal closes with swipe gesture",
        assertions: [
          "swipe gesture closes modal",
          "smooth animation plays",
          "dashboard is accessible again"
        ]
      }
    ],
    successCriteria: [
      "All functionality accessible on mobile",
      "Touch targets are appropriately sized",
      "Gestures work as expected",
      "Performance is acceptable on mobile"
    ]
  }
];

export const performanceWorkflows = [
  {
    id: "PERF-WF-001",
    name: "Large Dataset Performance",
    description: "Test dashboard performance with large amounts of data",
    setup: {
      initialData: testDataGeneration.generateLargeDataset(1000)
    },
    steps: [
      {
        description: "Load dashboard with 1000+ records",
        action: "navigate",
        target: "/dashboard",
        performance: {
          measure: "page_load_time",
          target: 3000,
          critical: 5000
        }
      },
      {
        description: "Apply complex filters",
        action: "apply_filters",
        filters: { region: "South", trainer: "H1761", health: "Perfect Shot" },
        performance: {
          measure: "filter_response_time", 
          target: 500,
          critical: 1000
        }
      }
    ]
  }
];

export default {
  workflowTests,
  performanceWorkflows
};