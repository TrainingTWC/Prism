// Google Apps Script for Employee Master Data
// Deploy this as a Web App with "Anyone" access

function doGet(e) {
  try {
    console.log('Employee Directory API - doGet called');
    
    // Get the spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('EMP. Master');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          error: 'Sheet "EMP. Master" not found',
          availableSheets: ss.getSheets().map(s => s.getName())
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data from the sheet
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({
          employees: [],
          count: 0
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // First row is headers
    const headers = values[0];
    console.log('Headers found:', headers);
    
    // Map headers to indexes
    const headerMap = {};
    headers.forEach((header, index) => {
      headerMap[header.toString().trim()] = index;
    });
    
    // Convert data rows to objects
    const employees = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // Skip empty rows
      if (!row[headerMap['Employee_Code']] && !row[headerMap['Employee Code']]) {
        continue;
      }
      
      const employee = {
        employee_code: row[headerMap['Employee_Code']] || row[headerMap['Employee Code']] || '',
        empname: row[headerMap['EmpName']] || row[headerMap['Employee Name']] || '',
        date_of_joining: row[headerMap['Date_Of_Joining']] || row[headerMap['Date of Joining']] || '',
        designation: row[headerMap['Designation']] || '',
        location: row[headerMap['Location']] || '',
        category: row[headerMap['Category']] || '',
        store_code: row[headerMap['Store_ID']] || row[headerMap['Store ID']] || row[headerMap['Store Code']] || ''
      };
      
      employees.push(employee);
    }
    
    console.log(`Returning ${employees.length} employees`);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        employees: employees,
        count: employees.length,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString(),
        message: 'Failed to fetch employee data'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function
function testEmployeeDirectory() {
  const result = doGet({});
  const json = JSON.parse(result.getContent());
  Logger.log('Employee count: ' + json.count);
  Logger.log('First 3 employees:');
  json.employees.slice(0, 3).forEach(emp => {
    Logger.log(`${emp.employee_code} - ${emp.empname} - ${emp.store_code}`);
  });
}
