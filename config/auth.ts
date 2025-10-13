// Configuration for Prism Dashboard Authentication
// Role-based password system for different departments

export interface RoleConfig {
  password: string;
  permissions: string[];
  dashboardAccess: string[];
}

export interface AuthConfig {
  roles: {
    [key: string]: RoleConfig;
  };
  sessionDuration: number;
  storageKeys: {
    auth: string;
    timestamp: string;
    role: string;
  };
}

export const AUTH_CONFIG: AuthConfig = {
  // Role-based passwords and permissions
  roles: {
    operations: {
      password: 'OpsAccess2024!',
      permissions: ['operations', 'dashboard'],
      dashboardAccess: ['operations-dashboard', 'operations-analytics', 'operations-reports']
    },
    hr: {
      password: 'HRConnect2024!',
      permissions: ['hr', 'dashboard', 'employee-data'],
      dashboardAccess: ['hr-dashboard', 'hr-analytics', 'employee-reports', 'training-audit']
    },
    qa: {
      password: 'QualityCheck2024!',
      permissions: ['qa', 'dashboard', 'quality-audits'],
      dashboardAccess: ['qa-dashboard', 'quality-reports', 'audit-checklists']
    },
    training: {
      password: 'TrainingHub2024!',
      permissions: ['training', 'dashboard', 'learning-management'],
      dashboardAccess: ['training-dashboard', 'training-reports', 'learning-analytics', 'training-audit']
    },
    finance: {
      password: 'FinanceSecure2024!',
      permissions: ['finance', 'dashboard', 'financial-reports'],
      dashboardAccess: ['finance-dashboard', 'financial-analytics', 'budget-reports']
    },
    admin: {
      password: 'AdminMaster2024!',
      permissions: ['admin', 'operations', 'hr', 'qa', 'training', 'finance', 'dashboard'],
      dashboardAccess: ['all']
    }
  },
  
  // Session duration in milliseconds (default: 24 hours)
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  
  // Storage keys
  storageKeys: {
    auth: 'prism_dashboard_auth',
    timestamp: 'prism_dashboard_auth_timestamp',
    role: 'prism_dashboard_user_role'
  }
};

// Alternative: You can also set different passwords for different environments
// Uncomment and modify the following if you need environment-specific passwords

// export const AUTH_CONFIG = {
//   password: process.env.NODE_ENV === 'production' 
//     ? 'ProductionPassword123!' 
//     : 'DevPassword123!',
//   sessionDuration: 24 * 60 * 60 * 1000,
//   storageKeys: {
//     auth: 'hr_dashboard_auth',
//     timestamp: 'hr_dashboard_auth_timestamp'
//   }
// };