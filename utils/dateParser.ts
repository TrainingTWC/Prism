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
    } else if (cleanedStr.includes('T') || cleanedStr.includes('Z') || /^\d{4}-\d{2}-\d{2}/.test(cleanedStr)) {
      // Handle ISO format dates (YYYY-MM-DD)
      // ISO format should be parsed correctly as-is without swapping
      const isoMatch = cleanedStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10);
        const day = parseInt(isoMatch[3], 10);
        
        // Parse as standard ISO: YYYY-MM-DD
        date = new Date(year, month - 1, day);
        console.log(`✓ Parsed ISO: "${cleanedStr}" -> Year=${year}, Month=${month}, Day=${day} -> ${date.toDateString()}`);
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
