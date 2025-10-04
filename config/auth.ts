// Configuration for Prism Dashboard Authentication
// Change the password here to whatever you want

export const AUTH_CONFIG = {
  // Change this password to your desired password
  password: 'HRConnect2024!',
  
  // Session duration in milliseconds (default: 24 hours)
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  
  // Storage keys (you probably don't need to change these)
  storageKeys: {
    auth: 'hr_dashboard_auth',
    timestamp: 'hr_dashboard_auth_timestamp'
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