/**
 * ⚠️ DEPRECATED - USE google-apps-script-trainer-calendar-dashboard.js INSTEAD
 * 
 * This script has been replaced by a unified version that handles BOTH:
 * 1. Calendar submissions (POST requests)
 * 2. Dashboard data fetching (GET requests)
 * 
 * NEW SCRIPT: google-apps-script-trainer-calendar-dashboard.js
 * 
 * The new script includes all functionality from this file PLUS dashboard support.
 * Please migrate to the new script for complete functionality.
 * 
 * ORIGINAL DESCRIPTION:
 * TRAINER CALENDAR - GOOGLE APPS SCRIPT
 * 
 * This script manages trainer calendar data in Google Sheets
 * Sheet Name: "Trainer Calendar"
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet named "Trainer Calendar"
 * 2. Go to Extensions > Apps Script
 * 3. Replace all code with google-apps-script-trainer-calendar-dashboard.js
 * 4. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the deployment URL
 * 6. Add to .env: VITE_TRAINER_CALENDAR_SCRIPT_URL=your_deployment_url
 */

// Sheet configuration
const SHEET_NAME = 'Trainer Calendar';
const DASHBOARD_SHEET_NAME = 'Calendar Data'; // For dashboard display

/**
 * Main entry point for POST requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case 'submitCalendar':
        return submitCalendar(data.data);
      default:
        return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Handle GET requests - for dashboard to fetch calendar data
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case 'getCalendarData':
        return getCalendarData(e.parameter);
      case 'getAllTrainerCalendars':
        return getAllTrainerCalendars();
      default:
        return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Submit trainer calendar data
 */
function submitCalendar(calendarData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Add headers
      sheet.getRange(1, 1, 1, 9).setValues([[
        'Trainer ID',
        'Trainer Name',
        'Date',
        'Event Type',
        'Store ID',
        'Store Name',
        'Task Type',
        'Additional Notes',
        'Submitted At'
      ]]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Clear existing data for this trainer (optional - comment out to keep history)
    // const trainerId = calendarData[0]?.trainerId;
    // if (trainerId) {
    //   const lastRow = sheet.getLastRow();
    //   if (lastRow > 1) {
    //     const dataRange = sheet.getRange(2, 1, lastRow - 1, 1);
    //     const values = dataRange.getValues();
    //     for (let i = values.length - 1; i >= 0; i--) {
    //       if (values[i][0] === trainerId) {
    //         sheet.deleteRow(i + 2);
    //       }
    //     }
    //   }
    // }

    // Append new data
    const rows = calendarData.map(event => [
      event.trainerId,
      event.trainerName,
      event.date,
      event.eventType,
      event.storeId,
      event.storeName,
      event.taskType,
      event.additionalNotes,
      event.timestamp
    ]);

    if (rows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rows.length, 9).setValues(rows);
    }

    // Auto-resize columns
    for (let i = 1; i <= 9; i++) {
      sheet.autoResizeColumn(i);
    }

    return createResponse(true, 'Calendar submitted successfully', {
      rowsAdded: rows.length
    });
  } catch (error) {
    console.error('Error submitting calendar:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Get calendar data for specific trainer or date range
 */
function getCalendarData(params) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return createResponse(true, 'No data available', { data: [] });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return createResponse(true, 'No data available', { data: [] });
    }

    // Get all data
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 9);
    const values = dataRange.getValues();
    const headers = sheet.getRange(1, 1, 1, 9).getValues()[0];

    // Filter data based on parameters
    let filteredData = values.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    // Apply filters
    if (params.trainerId) {
      filteredData = filteredData.filter(row => row['Trainer ID'] === params.trainerId);
    }

    if (params.dateFrom) {
      filteredData = filteredData.filter(row => row['Date'] >= params.dateFrom);
    }

    if (params.dateTo) {
      filteredData = filteredData.filter(row => row['Date'] <= params.dateTo);
    }

    return createResponse(true, 'Data retrieved successfully', {
      data: filteredData,
      count: filteredData.length
    });
  } catch (error) {
    console.error('Error getting calendar data:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Get all trainer calendars for dashboard view
 */
function getAllTrainerCalendars() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return createResponse(true, 'No data available', { data: [] });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return createResponse(true, 'No data available', { data: [] });
    }

    const dataRange = sheet.getRange(2, 1, lastRow - 1, 9);
    const values = dataRange.getValues();
    const headers = sheet.getRange(1, 1, 1, 9).getValues()[0];

    const data = values.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    // Group by trainer
    const groupedByTrainer = {};
    data.forEach(event => {
      const trainerId = event['Trainer ID'];
      if (!groupedByTrainer[trainerId]) {
        groupedByTrainer[trainerId] = {
          trainerId: trainerId,
          trainerName: event['Trainer Name'],
          events: []
        };
      }
      groupedByTrainer[trainerId].events.push(event);
    });

    return createResponse(true, 'Data retrieved successfully', {
      data: Object.values(groupedByTrainer),
      totalTrainers: Object.keys(groupedByTrainer).length,
      totalEvents: data.length
    });
  } catch (error) {
    console.error('Error getting all calendars:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Helper function to create JSON response
 */
function createResponse(success, message, data = {}) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
    ...data
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - Run this to verify the script works
 */
function testSubmitCalendar() {
  const testData = [
    {
      trainerId: 'h2595',
      trainerName: 'Kailash',
      date: '2025-12-04',
      eventType: 'store',
      storeId: 'S153',
      storeName: 'Lajpat Nagar',
      taskType: 'Store Visits',
      additionalNotes: 'Monthly training audit',
      timestamp: new Date().toISOString()
    },
    {
      trainerId: 'h2595',
      trainerName: 'Kailash',
      date: '2025-12-05',
      eventType: 'outdoor',
      storeId: '',
      storeName: '',
      taskType: 'Classroom session',
      additionalNotes: 'New hire orientation',
      timestamp: new Date().toISOString()
    }
  ];

  const result = submitCalendar(testData);
  Logger.log(result.getContent());
}

/**
 * Test function for getting data
 */
function testGetCalendarData() {
  const result = getCalendarData({ trainerId: 'h2595' });
  Logger.log(result.getContent());
}
