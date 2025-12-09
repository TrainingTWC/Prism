// Secure storage utilities with encryption
// Protects sensitive data stored in localStorage/sessionStorage

import CryptoJS from 'crypto-js';

// Generate a secure key from environment or use a default (should be changed in production)
const STORAGE_KEY = typeof window !== 'undefined' 
  ? (window as any).__STORAGE_ENCRYPTION_KEY__ || 'prism-secure-storage-v1'
  : 'prism-secure-storage-v1';

/**
 * WARNING: This is client-side encryption which provides obfuscation but not true security.
 * Sensitive data should be stored server-side and accessed via authenticated APIs.
 * This helps protect against casual inspection but not determined attackers.
 */

export const secureStorage = {
  /**
   * Encrypts and stores data in localStorage
   * @param key - Storage key
   * @param value - Data to store (will be JSON stringified)
   */
  setItem: (key: string, value: any): void => {
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(jsonString, STORAGE_KEY).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to encrypt and store data:', error);
      // Fallback to regular storage (not recommended for production)
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  /**
   * Retrieves and decrypts data from localStorage
   * @param key - Storage key
   * @returns Decrypted data or null if not found/invalid
   */
  getItem: (key: string): any => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      // Try to decrypt
      const decrypted = CryptoJS.AES.decrypt(encrypted, STORAGE_KEY);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        // Might be unencrypted data from before
        try {
          return JSON.parse(encrypted);
        } catch {
          return null;
        }
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  },

  /**
   * Removes item from storage
   * @param key - Storage key
   */
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },

  /**
   * Clears all storage (use with caution)
   */
  clear: (): void => {
    localStorage.clear();
  },

  /**
   * Checks if a key exists in storage
   * @param key - Storage key
   * @returns true if key exists
   */
  hasItem: (key: string): boolean => {
    return localStorage.getItem(key) !== null;
  }
};

/**
 * Session-only secure storage (cleared on browser close)
 */
export const secureSessionStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(jsonString, STORAGE_KEY).toString();
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to encrypt and store session data:', error);
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  },

  getItem: (key: string): any => {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(encrypted, STORAGE_KEY);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        try {
          return JSON.parse(encrypted);
        } catch {
          return null;
        }
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to decrypt session data:', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    sessionStorage.removeItem(key);
  },

  clear: (): void => {
    sessionStorage.clear();
  },

  hasItem: (key: string): boolean => {
    return sessionStorage.getItem(key) !== null;
  }
};

/**
 * Utility to migrate existing unencrypted data to encrypted storage
 * @param keys - Array of storage keys to migrate
 */
export const migrateToSecureStorage = (keys: string[]): void => {
  console.log('Migrating storage to encrypted format...');
  
  keys.forEach(key => {
    try {
      const existingData = localStorage.getItem(key);
      if (!existingData) return;

      // Try to parse as JSON (unencrypted)
      try {
        const data = JSON.parse(existingData);
        // Re-store using secure storage
        secureStorage.setItem(key, data);
        console.log(`Migrated key: ${key}`);
      } catch {
        // Already encrypted or invalid data, skip
      }
    } catch (error) {
      console.error(`Failed to migrate key ${key}:`, error);
    }
  });
  
  console.log('Migration complete');
};

/**
 * Clear all sensitive data from storage
 * Use this on logout or when security breach is detected
 */
export const clearAllSensitiveData = (): void => {
  const sensitiveKeys = [
    'prism_dashboard_auth',
    'prism_dashboard_auth_timestamp',
    'prism_dashboard_user_role',
    'auth_employee',
    'employee_validated',
    'campusHiringDraft',
    'qa_images',
    'training_calendar_events',
    'hr_resp',
    'hr_meta'
  ];

  sensitiveKeys.forEach(key => {
    secureStorage.removeItem(key);
    secureSessionStorage.removeItem(key);
  });

  console.log('All sensitive data cleared');
};

/**
 * Check if storage is available and working
 * @returns true if storage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};
