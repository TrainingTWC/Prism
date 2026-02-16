// Configuration for Prism Dashboard Authentication
// Role-based password system for different departments
//
// ⚠️ CRITICAL SECURITY WARNING ⚠️
// This file contains PLAINTEXT PASSWORDS which is a CRITICAL SECURITY VULNERABILITY!
// Anyone with access to this source code can see all passwords and bypass authentication.
//
// TODO - URGENT: Implement proper authentication:
// 1. Move authentication to backend server (Node.js/Express)
// 2. Hash passwords using bcrypt or argon2
// 3. Store password hashes in environment variables or secure database
// 4. Use JWT tokens with httpOnly cookies for sessions
// 5. Add rate limiting to prevent brute force attacks
//
// This is a TEMPORARY implementation for development/internal use only.
// DO NOT deploy to production or expose publicly in current state.
//
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
    hr: {
      password: 'HRConnect2024!',
      permissions: ['hr', 'campus-hiring', 'bench-planning', 'dashboard'],
      dashboardAccess: ['hr-dashboard', 'campus-hiring-dashboard', 'bench-planning-dashboard', 'bench-planning-sm-asm-dashboard']
    },
    training: {
      password: 'TrainingHub2024!',
      permissions: ['training', 'shlp', 'bench-planning', 'brew-league', 'dashboard'],
      dashboardAccess: ['training-dashboard', 'shlp-dashboard', 'bench-planning-dashboard', 'bench-planning-sm-asm-dashboard', 'trainer-calendar-dashboard']
    },
    qa: {
      password: 'QualityCheck2024!',
      permissions: ['qa', 'dashboard'],
      dashboardAccess: ['qa-dashboard']
    },
    finance: {
      password: 'FinanceSecure2024!',
      permissions: ['finance', 'dashboard'],
      dashboardAccess: ['finance-dashboard']
    },
    operations: {
      password: 'OpsAccess2024!',
      permissions: ['operations', 'shlp', 'bench-planning', 'brew-league', 'dashboard'],
      dashboardAccess: ['operations-dashboard', 'shlp-dashboard', 'bench-planning-dashboard', 'bench-planning-sm-asm-dashboard']
    },
    store: {
      password: 'StoreAccess2025!',
      permissions: ['shlp', 'brew-league', 'bench-planning'],
      dashboardAccess: []
    },
    'campus-hiring': {
      password: 'CampusHire2024!',
      permissions: ['campus-hiring'],
      dashboardAccess: []
    },
    admin: {
      password: 'AdminView2024!',
      permissions: ['admin', 'operations', 'hr', 'qa', 'training', 'finance', 'shlp', 'campus-hiring', 'bench-planning', 'brew-league', 'dashboard'],
      dashboardAccess: ['all', 'campus-hiring-dashboard', 'bench-planning-dashboard', 'bench-planning-sm-asm-dashboard', 'trainer-calendar-dashboard']
    },
    editor: {
      password: 'Editornotcreator2025!',
      permissions: ['admin', 'operations', 'hr', 'qa', 'training', 'finance', 'shlp', 'campus-hiring', 'bench-planning', 'brew-league', 'dashboard'],
      dashboardAccess: ['all', 'campus-hiring-dashboard', 'trainer-calendar-dashboard', 'bench-planning-dashboard', 'bench-planning-sm-asm-dashboard']
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