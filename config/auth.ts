// Configuration for Prism Dashboard Authentication
// Role-based password system for different departments
// supabase password: J!ddQZYdx**%72C
//http://192.168.120.219:3001/Prism/?EMPID=h541

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
      dashboardAccess: ['hr-dashboard', 'hr-analytics', 'employee-reports', 'training-audit', 'campus-hiring-dashboard']
    },
    qa: {
      password: 'QualityCheck2024!',
      permissions: ['qa', 'dashboard', 'quality-audits'],
      dashboardAccess: ['qa-dashboard', 'quality-reports', 'audit-checklists']
    },
    training: {
      password: 'TrainingHub2024!',
      permissions: ['training', 'dashboard', 'learning-management'],
      dashboardAccess: ['training-dashboard', 'training-reports', 'learning-analytics', 'training-audit', 'trainer-calendar-dashboard']
    },
    forms: {
      password: 'MT2025!',
      permissions: ['forms'],
      dashboardAccess: ['forms-surveys'] // Only access to forms, no dashboard
    },
    finance: {
      password: 'FinanceSecure2024!',
      permissions: ['finance', 'dashboard', 'financial-reports'],
      dashboardAccess: ['finance-dashboard', 'financial-analytics', 'budget-reports']
    },
    'campus-hiring': {
      password: 'CampusHire2024!',
      permissions: ['campus-hiring'],
      dashboardAccess: [] // No dashboard access - checklist only
    },
    admin: {
      password: 'AdminView2024!',
      permissions: ['operations', 'hr', 'qa', 'training', 'finance', 'campus-hiring', 'dashboard'],
      dashboardAccess: ['all', 'campus-hiring-dashboard']
    },
    editor: {
      password: 'Editornotcreator2025!',
      permissions: ['admin', 'operations', 'hr', 'qa', 'training', 'finance', 'campus-hiring', 'dashboard'],
      dashboardAccess: ['all', 'campus-hiring-dashboard', 'trainer-calendar-dashboard']
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