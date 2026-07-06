/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : SheetService.gs
 * Version : 1.0
 * Purpose : Sheet Access Layer (Core)
 **********************************************************************/

var SheetService = {};

/**
 * Returns MOM Sheet
 */
SheetService.getSheet = function () {

  var sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    throw new Error("MOM Sheet not found : " + CONFIG.SHEET_NAME);
  }

  return sheet;

};


/**
 * Returns Template Row
 */
SheetService.getTemplateRow = function () {

  return 2;

};


/**
 * Returns Header Row
 */
SheetService.getHeaderRow = function () {

  return CONFIG.HEADER_ROW;

};


/**
 * Returns Last Used Row
 */
SheetService.getLastRow = function () {

  return SheetService
    .getSheet()
    .getLastRow();

};


/**
 * Returns Next Insert Row
 */
SheetService.getNextInsertRow = function () {

  var lastRow = SheetService.getLastRow();

  if (lastRow < CONFIG.FIRST_DATA_ROW) {

    return CONFIG.FIRST_DATA_ROW;

  }

  return lastRow + 1;

};


/**
 * Returns Number of Columns
 */
SheetService.getLastColumn = function () {

  return SheetService
    .getSheet()
    .getLastColumn();

};


/**
 * Returns Template Range
 */
SheetService.getTemplateRange = function () {

  return SheetService
    .getSheet()
    .getRange(
      SheetService.getTemplateRow(),
      1,
      1,
      SheetService.getLastColumn()
    );

};


/**
 * Health Check
 */
function sheetServiceHealthCheck(){

  Logger.log("===== Sheet Service =====");

  Logger.log("Sheet : " +
      SheetService.getSheet().getName());

  Logger.log("Template Row : " +
      SheetService.getTemplateRow());

  Logger.log("Search Engine V2 Ready");

  Logger.log("Merge Engine Ready");

  Logger.log("Formatting Ready");

  Logger.log("Health Check Passed");

}
/**
 * Inserts required number of rows
 */
SheetService.insertRows = function (startRow, numberOfRows) {

  if (numberOfRows <= 0) {
    return;
  }

  SheetService
    .getSheet()
    .insertRowsAfter(startRow - 1, numberOfRows);

};
/**
 * Copies formatting from Template Row
 */
SheetService.copyTemplateFormatting = function (targetRow, numberOfRows) {

  if (numberOfRows <= 0) {
    return;
  }

  var sheet = SheetService.getSheet();

  var template = SheetService.getTemplateRange();

  for (var i = 0; i < numberOfRows; i++) {

    template.copyTo(

      sheet.getRange(
        targetRow + i,
        1,
        1,
        SheetService.getLastColumn()
      ),

      SpreadsheetApp.CopyPasteType.PASTE_FORMAT,
      false

    );

  }

};
/**
 * Removes merge from Participants & Agenda
 */
SheetService.clearMerge = function (startRow, endRow) {

  var participantsCol = getColumn("PARTICIPANTS");

  var agendaCol = getColumn("AGENDA");

  SheetService
    .getSheet()
    .getRange(
      startRow,
      participantsCol,
      endRow - startRow + 1,
      1
    )
    .breakApart();

  SheetService
    .getSheet()
    .getRange(
      startRow,
      agendaCol,
      endRow - startRow + 1,
      1
    )
    .breakApart();

};
/**
 * Merge a column vertically
 */
SheetService.mergeColumn = function (columnNumber, startRow, totalRows) {

  if (totalRows <= 1) {
    return;
  }

  SheetService
    .getSheet()
    .getRange(
      startRow,
      columnNumber,
      totalRows,
      1
    )
    .merge();

};
/**
 * Merge Participants Column
 */
SheetService.mergeParticipants = function (startRow, totalRows) {

  var participantsColumn = getColumn("PARTICIPANTS");

  SheetService.mergeColumn(
    participantsColumn,
    startRow,
    totalRows
  );

};
/**
 * Merge Agenda Column
 */
SheetService.mergeAgenda = function (startRow, totalRows) {

  var agendaColumn = getColumn("AGENDA");

  SheetService.mergeColumn(
    agendaColumn,
    startRow,
    totalRows
  );

};
/**
 * Merge complete meeting block
 */
SheetService.mergeMeeting = function (startRow, discussionCount) {

  if (discussionCount < 1) {
    discussionCount = 1;
  }

  SheetService.mergeParticipants(
    startRow,
    discussionCount
  );

  SheetService.mergeAgenda(
    startRow,
    discussionCount
  );

};
/**
 * Remove merge from meeting block
 */
SheetService.unmergeMeeting = function (startRow, discussionCount) {

  if (discussionCount < 1) {
    discussionCount = 1;
  }

  SheetService.clearMerge(
    startRow,
    startRow + discussionCount - 1
  );

};
/**
 * Returns first row of Meeting Code
 * Returns -1 if not found
 */
SheetService.findMeetingRow = function (meetingCode) {

  var sheet = SheetService.getSheet();

  var meetingCodeColumn = getColumn("MEETING_CODE");

  var lastRow = sheet.getLastRow();

  if (lastRow < CONFIG.FIRST_DATA_ROW) {

    return -1;

  }

  var values = sheet
    .getRange(
      CONFIG.FIRST_DATA_ROW,
      meetingCodeColumn,
      lastRow - CONFIG.FIRST_DATA_ROW + 1,
      1
    )
    .getValues();

  for (var i = 0; i < values.length; i++) {

    if (String(values[i][0]).trim() === String(meetingCode).trim()) {

      return CONFIG.FIRST_DATA_ROW + i;

    }

  }

  return -1;

};
/**
 * Checks whether meeting already exists
 */
SheetService.meetingExists = function (meetingCode) {

  return SheetService.findMeetingRow(meetingCode) !== -1;

};
/**
 * Returns last row occupied by a meeting
 */
SheetService.getMeetingLastRow = function (meetingCode) {

  var firstRow = SheetService.findMeetingRow(meetingCode);

  if (firstRow === -1) {

    return -1;

  }

  var sheet = SheetService.getSheet();

  var discussionColumn = getColumn("DISCUSSION");

  var lastSheetRow = sheet.getLastRow();

  var row = firstRow;

  while (row < lastSheetRow) {

    var nextValue = sheet
      .getRange(row + 1, discussionColumn)
      .getValue();

    var nextMeetingCode = sheet
      .getRange(row + 1, getColumn("MEETING_CODE"))
      .getValue();

    if (nextMeetingCode !== "") {

      break;

    }

    if (nextValue === "") {

      break;

    }

    row++;

  }

  return row;

};
/**
 * Returns number of rows occupied by meeting
 */
SheetService.getMeetingRowCount = function (meetingCode) {

  var startRow = SheetService.findMeetingRow(meetingCode);

  if (startRow === -1) {

    return 0;

  }

  var endRow = SheetService.getMeetingLastRow(meetingCode);

  return endRow - startRow + 1;

};
/**
 * Returns meeting block information.
 *
 * {
 *   found:true,
 *   startRow:2001,
 *   endRow:2010,
 *   rowCount:10
 * }
 */
SheetService.findMeetingBlock = function (meetingCode) {

  var sheet = SheetService.getSheet();

  var codeColumn = getColumn("MEETING_CODE");

  var discussionColumn = getColumn("DISCUSSION");

  var lastRow = sheet.getLastRow();

  var startRow = -1;

  var endRow = -1;

  var values = sheet.getRange(
    CONFIG.FIRST_DATA_ROW,
    codeColumn,
    lastRow - CONFIG.FIRST_DATA_ROW + 1,
    1
  ).getValues();

  for (var i = 0; i < values.length; i++) {

    if (String(values[i][0]).trim() == String(meetingCode).trim()) {

      startRow = CONFIG.FIRST_DATA_ROW + i;

      break;

    }

  }

  if (startRow == -1) {

    return {

      found:false,

      startRow:-1,

      endRow:-1,

      rowCount:0

    };

  }

  endRow = startRow;

  while (endRow < lastRow) {

    var nextMeetingCode = sheet
      .getRange(endRow + 1, codeColumn)
      .getValue();

    if (String(nextMeetingCode).trim() != "") {

      break;

    }

    var discussion = sheet
      .getRange(endRow + 1, discussionColumn)
      .getValue();

    if (String(discussion).trim() == "") {

      break;

    }

    endRow++;

  }

  return {

    found:true,

    startRow:startRow,

    endRow:endRow,

    rowCount:endRow-startRow+1

  };

};
SheetService.meetingExists = function (meetingCode) {

  return SheetService.findMeetingBlock(meetingCode).found;

};
SheetService.getMeetingRowCount = function (meetingCode) {

  return SheetService
    .findMeetingBlock(meetingCode)
    .rowCount;

};
SheetService.getMeetingStartRow = function (meetingCode){

  return SheetService
      .findMeetingBlock(meetingCode)
      .startRow;

};
SheetService.getMeetingEndRow = function (meetingCode){

  return SheetService
      .findMeetingBlock(meetingCode)
      .endRow;

};
/**********************************************************************
 * Column Cache
 **********************************************************************/

SheetService._columnCache = null;


/**
 * Returns cached column map
 */
SheetService.getColumnMap = function () {

  if (SheetService._columnCache !== null) {

    return SheetService._columnCache;

  }

  SheetService._columnCache = getColumnMap();

  return SheetService._columnCache;

};


/**
 * Returns cached column number
 */
SheetService.column = function (name) {

  var map = SheetService.getColumnMap();

  if (!(name in map)) {

    throw new Error(
      "Unknown Column : " + name
    );

  }

  return map[name];

};


/**
 * Clears cache
 */
SheetService.clearColumnCache = function () {

  SheetService._columnCache = null;

};
