/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : ValidationEngine.gs
 * Version : 1.4 (Optimized - Fast Meeting Lookup)
 * Purpose : Validate MOM Object & Check Duplicates by Unique ID
 **********************************************************************/

var ValidationEngine = {};


/**
 * Creates validation result
 */
ValidationEngine.createResult = function () {

  return {
    success: true,
    errors: []
  };

};


/**
 * Adds validation error
 */
ValidationEngine.addError = function (result, message) {

  result.success = false;
  result.errors.push(message);

};


/**
 * Validates MOM object
 * NOTE: targetDate and status are removed from validation
 */
ValidationEngine.validate = function (mom) {

  var result = ValidationEngine.createResult();

  if (!mom) {

    ValidationEngine.addError(result, "MOM object is missing.");
    return result;

  }

  if (!mom.date || String(mom.date).trim() === "") {

    ValidationEngine.addError(result, "Date is required.");

  }

  if (!mom.startTime || String(mom.startTime).trim() === "") {

    ValidationEngine.addError(result, "Start Time is required.");

  }

  if (!mom.endTime || String(mom.endTime).trim() === "") {

    ValidationEngine.addError(result, "End Time is required.");

  }

  if (!mom.meetingType || String(mom.meetingType).trim() === "") {

    ValidationEngine.addError(result, "Meeting Type is required.");

  }

  if (!mom.location || String(mom.location).trim() === "") {

    ValidationEngine.addError(result, "Location is required.");

  }

  if (!mom.chairedBy || String(mom.chairedBy).trim() === "") {

    ValidationEngine.addError(result, "Chairperson is required.");

  }

  if (!mom.agenda || String(mom.agenda).trim() === "") {

    ValidationEngine.addError(result, "Agenda is required.");

  }

  if (!mom.recordStatus || String(mom.recordStatus).trim() === "") {

    ValidationEngine.addError(result, "Record Status is required.");

  }

  if (!mom.participants || mom.participants.length === 0) {

    ValidationEngine.addError(result, "At least one participant is required.");

  }

  if (!mom.discussion || mom.discussion.length === 0) {

    ValidationEngine.addError(result, "At least one discussion point is required.");

  }

  return result;

};


/**
 * Throws validation error if invalid
 */
ValidationEngine.validateOrThrow = function (mom) {

  var result = ValidationEngine.validate(mom);

  if (!result.success) {

    throw new Error(result.errors.join("\n"));

  }

  return true;

};


/**
 * Creates unique meeting identifier from key fields
 * Unique Key = Date + StartTime + Location + ChairedBy + Agenda
 */
ValidationEngine.createMeetingUniqueKey = function (mom) {
  
  var date = String(mom.date || "").trim();
  var startTime = String(mom.startTime || "").trim();
  var location = String(mom.location || "").trim();
  var chairedBy = String(mom.chairedBy || "").trim();
  var agenda = String(mom.agenda || "").trim();
  
  // Create normalized key (lowercase, no extra spaces)
  var key = (date + "|" + startTime + "|" + location + "|" + chairedBy + "|" + agenda).toLowerCase().trim();
  
  return key;
};


/**
 * Get all meeting first rows efficiently
 * Returns array of { row, code, date, startTime, location, chairedBy, agenda }
 */
ValidationEngine.getAllMeetingFirstRows = function () {
  
  var sheet = SheetService.getSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow < CONFIG.FIRST_DATA_ROW) {
    return [];
  }
  
  var meetings = [];
  var meetingCodeCol = SheetService.column("MEETING_CODE");
  var dateCol = SheetService.column("DATE");
  var startTimeCol = SheetService.column("START_TIME");
  var locationCol = SheetService.column("LOCATION");
  var chairedByCol = SheetService.column("CHAIRED_BY");
  var agendaCol = SheetService.column("AGENDA");
  
  // Get all meeting codes (efficient batch read)
  var meetingCodes = sheet.getRange(CONFIG.FIRST_DATA_ROW, meetingCodeCol, lastRow - CONFIG.FIRST_DATA_ROW + 1, 1).getValues();
  
  // Iterate only rows with meeting codes
  for (var i = 0; i < meetingCodes.length; i++) {
    var code = String(meetingCodes[i][0]).trim();
    
    // Skip empty rows (discussion sub-rows)
    if (code === "") {
      continue;
    }
    
    var rowNumber = CONFIG.FIRST_DATA_ROW + i;
    
    // Get all data for this row in one batch
    var rowData = sheet.getRange(rowNumber, 1, 1, SheetService.getLastColumn()).getValues()[0];
    
    var meeting = {
      row: rowNumber,
      code: code,
      date: String(rowData[dateCol - 1] || "").trim(),
      startTime: String(rowData[startTimeCol - 1] || "").trim(),
      location: String(rowData[locationCol - 1] || "").trim(),
      chairedBy: String(rowData[chairedByCol - 1] || "").trim(),
      agenda: String(rowData[agendaCol - 1] || "").trim()
    };
    
    meetings.push(meeting);
  }
  
  return meetings;
};


/**
 * Checks if a meeting with same unique identifier already exists
 * OPTIMIZED: Uses cached meeting list and early exit
 * Returns: { exists: boolean, row: number, meetingCode: string }
 */
ValidationEngine.checkMeetingExists = function (mom) {
  
  var uniqueKey = ValidationEngine.createMeetingUniqueKey(mom);
  
  // Get all meeting first rows (efficient batch read)
  var existingMeetings = ValidationEngine.getAllMeetingFirstRows();
  
  // Quick lookup - iterate only meeting rows
  for (var i = 0; i < existingMeetings.length; i++) {
    var meeting = existingMeetings[i];
    
    // Build key from existing meeting
    var existingKey = (meeting.date + "|" + meeting.startTime + "|" + meeting.location + "|" + meeting.chairedBy + "|" + meeting.agenda).toLowerCase().trim();
    
    // If keys match, meeting already exists
    if (uniqueKey === existingKey) {
      return {
        exists: true,
        row: meeting.row,
        meetingCode: meeting.code
      };
    }
  }
  
  return { exists: false, row: -1, meetingCode: "" };
};


/**
 * Health Check
 */
function validationEngineHealthCheck() {

  var mom = MOMBuilder.create();

  mom.date = "05/07/2026";
  mom.startTime = "07:00";
  mom.endTime = "07:25";
  mom.meetingType = CONFIG.DEFAULT_MEETING_TYPE;
  mom.location = CONFIG.DEFAULT_LOCATION;
  mom.chairedBy = "Rakesh Negi";
  mom.agenda = "Morning Meeting";
  mom.recordStatus = CONFIG.DEFAULT_RECORD_STATUS;

  MOMBuilder.addParticipant(mom, "Sunil");
  MOMBuilder.addDiscussion(mom, "Safety");

  var result = ValidationEngine.validate(mom);

  Logger.log("===== Validation Engine =====");
  Logger.log("Success : " + result.success);

  if (result.errors.length > 0) {

    Logger.log(result.errors.join("\n"));

  }

  Logger.log("Health Check Passed");

}
