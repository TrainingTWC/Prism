/**
 * Utility function to parse dates from Google Sheets and other sources
 * Handles multiple formats:
 * - DD/MM/YYYY, HH:MM:SS (from Google Sheets Apps Script - most common)
 * - MM/DD/YYYY (US format)
 * - ISO format (YYYY-MM-DD)
 */
export const parseSubmissionDate = (dateStr: any): Date | null => {
  if (!dateStr) {
    return null;
  }

  let date: Date | null = null;

  // Handle different date formats
  if (typeof dateStr === 'string') {
    // Remove any extra whitespace
    const cleanedStr = dateStr.trim();
    
    // Check for DD/MM/YYYY format with optional time (e.g., "29/09/2025, 14:22:55" or "25/09/2025")
    // This is the primary format from Google Sheets Submission Time column
    const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+[\d:]+)?$/;
    const ddmmMatch = cleanedStr.match(ddmmyyyyPattern);
    
    if (ddmmMatch) {
      const firstNum = parseInt(ddmmMatch[1], 10);
      const secondNum = parseInt(ddmmMatch[2], 10);
      const year = parseInt(ddmmMatch[3], 10);
      
      // ALWAYS use DD/MM/YYYY format for Google Sheets data
      // firstNum = day, secondNum = month
      const day = firstNum;
      const month = secondNum;
      
      date = new Date(year, month - 1, day);
      console.log(`✓ Parsed DD/MM/YYYY: "${cleanedStr}" -> Day=${day}, Month=${month}, Year=${year} -> ${date.toDateString()}`);
    } else if (cleanedStr.includes('T') || cleanedStr.includes('Z')) {
      // Handle ISO format dates (legacy data that was incorrectly stored)
      // IMPORTANT: ISO dates like "2025-06-11" were meant to be DD/MM (Nov 6), not MM/DD (Jun 11)
      // So we need to swap month and day for these legacy dates
      const isoMatch = cleanedStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const isoMonth = parseInt(isoMatch[2], 10); // This was supposed to be day
        const isoDay = parseInt(isoMatch[3], 10);   // This was supposed to be month
        
        // Swap them to correct the legacy data: treat as DD/MM/YYYY
        const day = isoDay;    // 11 becomes day
        const month = isoMonth; // 06 becomes month (June -> but should be day 06)
        
        // Actually, we need to swap: YYYY-MM-DD where MM should have been DD and DD should have been MM
        // "2025-06-11" means it stored month=06, day=11, but original was 11/06/2025 (DD/MM)
        // So: day should be 11, month should be 06... wait that's correct for November 6!
        // Let me reconsider: if original was "06/11/2025" (6th November), 
        // Google stored it as "2025-06-11" thinking it was June 11
        // So we need: day=06 (first number), month=11 (second number)
        
        date = new Date(year, isoDay - 1, isoMonth); // Swap: use isoDay as month-1, isoMonth as day
        console.log(`✓ Parsed ISO (SWAPPED for legacy): "${cleanedStr}" -> Original ISO: ${year}-${isoMonth}-${isoDay}, Corrected to Day=${isoMonth}, Month=${isoDay}, Year=${year} -> ${date.toDateString()}`);
      } else {
        date = new Date(cleanedStr);
        console.log(`✓ Parsed ISO/other: "${cleanedStr}" -> ${date.toDateString()}`);
      }
    } else {
      // Try parsing ISO format or other common formats
      date = new Date(cleanedStr);
      if (!isNaN(date.getTime())) {
        console.log(`✓ Parsed ISO/other: "${cleanedStr}" -> ${date.toDateString()}`);
      }
    }
  } else if (dateStr instanceof Date) {
    date = dateStr;
  } else if (typeof dateStr === 'number') {
    date = new Date(dateStr);
  }

  // Validate date
  if (!date || isNaN(date.getTime())) {
    return null;
  }

  return date;
};

/**
 * Get month key in format "MONTH YEAR" (e.g., "SEPTEMBER 2024")
 */
export const getMonthKey = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
};

/**
 * Format date for display
 */
export const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};
