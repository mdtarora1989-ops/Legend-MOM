/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * File    : SetupSheet.gs
 * Purpose : Create main MOM sheet with headers and template row
 **********************************************************************/

function createMomSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = CONFIG.SHEET_NAME;

  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    Logger.log("Main MOM sheet already exists: " + sheetName);
    return sheet;
  }

  sheet = ss.insertSheet(sheetName, 0);

  var headerMap = CONFIG.HEADERS;
  var headers = [];
  var keys = Object.keys(headerMap);
  for (var i = 0; i < keys.length; i++) {
    headers.push(headerMap[keys[i]]);
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, 1, headers.length).setValues([headers.map(function () { return ""; })]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);

  // Basic template formatting for row 2
  try {
    sheet.setRowHeight(2, 30);
  } catch (e) {
    // ignore in case of protected sheet
  }

  Logger.log("Created MOM sheet: " + sheetName);
  return sheet;
}
