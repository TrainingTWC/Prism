// SHLP Data Service
// Handles fetching SHLP assessment data from Google Apps Script

export interface SHLPSubmission {
  'Server Timestamp': string;
  'Submission Time': string;
  'Employee Name': string;
  'Employee ID': string;
  'Store': string;
  'Area Manager': string;
  'Trainer': string;
  
  // Individual responses (SHLP_1 to SHLP_36)
  SHLP_1: string;
  SHLP_2: string;
  SHLP_3: string;
  SHLP_4: string;
  SHLP_5: string;
  SHLP_6: string;
  SHLP_7: string;
  SHLP_8: string;
  SHLP_9: string;
  SHLP_10: string;
  SHLP_11: string;
  SHLP_12: string;
  SHLP_13: string;
  SHLP_14: string;
  SHLP_15: string;
  SHLP_16: string;
  SHLP_17: string;
  SHLP_18: string;
  SHLP_19: string;
  SHLP_20: string;
  SHLP_21: string;
  SHLP_22: string;
  SHLP_23: string;
  SHLP_24: string;
  SHLP_25: string;
  SHLP_26: string;
  SHLP_27: string;
  SHLP_28: string;
  SHLP_29: string;
  SHLP_30: string;
  SHLP_31: string;
  SHLP_32: string;
  SHLP_33: string;
  SHLP_34: string;
  SHLP_35: string;
  SHLP_36: string;
  
  // Section scores
  Store_Readiness_Score: string;
  Product_Quality_Score: string;
  Cash_Admin_Score: string;
  Team_Management_Score: string;
  Operations_Score: string;
  Safety_Score: string;
  Business_Score: string;
  Overall_Score: string;
  Overall_Percentage: string;
}

const SHLP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw0ndZitHKmrI3z3MFzCfFn90sl1ljDkBVZjdM6NjCDN1mteJM-r7uDy_U5EBKy_AMwPQ/exec';

export const fetchSHLPData = async (): Promise<SHLPSubmission[]> => {
  try {
    
    const response = await fetch(`${SHLP_ENDPOINT}?action=getSHLPData`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.result === 'success' && Array.isArray(result.data)) {
      return result.data;
    } else {
      console.warn('⚠️ Unexpected SHLP API response structure:', result);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching SHLP data:', error);
    return [];
  }
};