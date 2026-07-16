/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : AIController.js
 * Version : 2.6 (ULTRA-FAST - Direct Write, No Timeout)
 * Purpose : AI Workspace Controller
 **********************************************************************/

/**
 * Include HTML Partials
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Opens AI Workspace
 */
function openAIAssistant() {
  const html = HtmlService.createTemplateFromFile("AIWorkspace")
    .evaluate()
    .setTitle("Legend AI Workspace");

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Generates AI Prompt
 */
function generatePrompt(notes) {
  notes = String(notes || "").trim();

  if (notes === "") {
    throw new Error("Meeting notes cannot be empty.");
  }

  return PromptEngine.build(PromptEngine.TYPES.MOM, notes);
}

/**
 * Validate AI JSON
 */
function validateAIResponse(text) {
  text = String(text || "").trim();

  if (text === "") {
    return {
      success: false,
      message: "Empty AI response.",
    };
  }

  text = text.replace(/^```json/i, "");
  text = text.replace(/^```/i, "");
  text = text.replace(/```$/i, "");

  try {
    const json = JSON.parse(text);
    return {
      success: true,
      message: "JSON Valid",
      data: json,
    };
  } catch (error) {
    return {
      success: false,
      message: "Invalid JSON\n\n" + error.message,
    };
  }
}

/**
 * Normalize JSON field names
 */
function normalizeJSONFields(json) {
  if (json.meetingDate && !json.date) json.date = json.meetingDate;
  if (json.startingTime && !json.startTime) json.startTime = json.startingTime;
  if (json.endingTime && !json.endTime) json.endTime = json.endingTime;
  if (json.mType && !json.meetingType) json.meetingType = json.mType;
  if (json.chairperson && !json.chairedBy) json.chairedBy = json.chairperson;
  if (json.owner && !json.operationOwner) json.operationOwner = json.owner;
  return json;
}

/**
 * Auto-generate meeting code
 */
function ensureMeetingCode(json) {
  if (json.meetingCode && String(json.meetingCode).trim() !== "") {
    return json;
  }
  json.meetingCode = MeetingCodeEngine.generate();
  return json;
}

/**
 * Check duplicate by unique identifier
 */
function checkUniqueMeeting(json) {
  
  if (!json.date || String(json.date).trim() === "") {
    throw new Error("Meeting Date is missing from JSON.");
  }
  if (!json.startTime || String(json.startTime).trim() === "") {
    throw new Error("Start Time is missing from JSON.");
  }
  if (!json.location || String(json.location).trim() === "") {
    throw new Error("Location is missing from JSON.");
  }
  if (!json.chairedBy || String(json.chairedBy).trim() === "") {
    throw new Error("Chaired By is missing from JSON.");
  }
  if (!json.agenda || String(json.agenda).trim() === "") {
    throw new Error("Agenda is missing from JSON.");
  }

  var existingMeeting = ValidationEngine.checkMeetingExists(json);
  
  if (existingMeeting.exists) {
    throw new Error(
      "❌ DUPLICATE MEETING DETECTED!\n\n" +
      "A meeting with these details already exists:\n\n" +
      "Date: " + json.date + "\n" +
      "Time: " + json.startTime + "\n" +
      "Location: " + json.location + "\n" +
      "Chaired By: " + json.chairedBy + "\n" +
      "Agenda: " + json.agenda + "\n\n" +
      "Meeting Code: " + existingMeeting.meetingCode + " (Row " + existingMeeting.row + ")\n\n" +
      "Please verify your data or use different meeting details."
    );
  }

  return true;
}

/**
 * Helper: Parse time string to decimal
 */
function parseTimeToDecimal(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return '';
  }
  
  timeStr = timeStr.trim();
  var match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return timeStr;
  }
  
  var hours = parseInt(match[1], 10);
  var minutes = parseInt(match[2], 10);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return timeStr;
  }
  
  var decimalTime = (hours + minutes / 60) / 24;
  return decimalTime;
}

/**
 * ULTRA-SIMPLIFIED INSERT - Direct sheet operations only
 * NO nested function calls that cause timeout
 */
function insertValidatedResponse(text) {
  
  var validation = validateAIResponse(text);
  if (!validation.success) {
    return validation;
  }

  try {
    var jsonData = normalizeJSONFields(validation.data);
    jsonData = ensureMeetingCode(jsonData);
    checkUniqueMeeting(jsonData);
    
    var sheet = SheetService.getSheet();
    var nextRow = SheetService.getNextInsertRow();
    
    // Count discussions
    var discussionCount = (jsonData.discussion && Array.isArray(jsonData.discussion)) 
      ? jsonData.discussion.length 
      : 1;
    if (discussionCount < 1) discussionCount = 1;
    
    var totalRows = discussionCount;
    var endRow = nextRow + totalRows - 1;
    
    // Get column indices
    var dateCol = SheetService.column("DATE");
    var startTimeCol = SheetService.column("START_TIME");
    var endTimeCol = SheetService.column("END_TIME");
    var codeCol = SheetService.column("MEETING_CODE");
    var typeCol = SheetService.column("MEETING_TYPE");
    var locCol = SheetService.column("LOCATION");
    var chairCol = SheetService.column("CHAIRED_BY");
    var discussionCol = SheetService.column("DISCUSSION");
    var participantCol = SheetService.column("PARTICIPANTS");
    var agendaCol = SheetService.column("AGENDA");
    var recordCol = SheetService.column("RECORD");
    
    // Insert rows if needed
    if (totalRows > 1) {
      sheet.insertRowsAfter(nextRow - 1, totalRows - 1);
    }
    
    // Write meeting header row (first row with all fields)
    sheet.getRange(nextRow, dateCol).setValue(jsonData.date);
    sheet.getRange(nextRow, startTimeCol).setValue(parseTimeToDecimal(jsonData.startTime));
    sheet.getRange(nextRow, endTimeCol).setValue(parseTimeToDecimal(jsonData.endTime));
    sheet.getRange(nextRow, codeCol).setValue(jsonData.meetingCode);
    sheet.getRange(nextRow, typeCol).setValue(jsonData.meetingType || "");
    sheet.getRange(nextRow, locCol).setValue(jsonData.location || "");
    sheet.getRange(nextRow, chairCol).setValue(jsonData.chairedBy || "");
    sheet.getRange(nextRow, recordCol).setValue(jsonData.recordStatus || "");
    
    // Write participants (merged)
    var participantsText = "";
    if (jsonData.participants && Array.isArray(jsonData.participants)) {
      participantsText = jsonData.participants.map(function(p) { 
        return (p.name || p) + (p.role ? " (" + p.role + ")" : "");
      }).join("\n");
    }
    sheet.getRange(nextRow, participantCol).setValue(participantsText);
    
    // Write agenda (merged)
    sheet.getRange(nextRow, agendaCol).setValue(jsonData.agenda || "");
    
    // Write discussions (separate rows)
    if (jsonData.discussion && Array.isArray(jsonData.discussion)) {
      for (var i = 0; i < jsonData.discussion.length; i++) {
        sheet.getRange(nextRow + i, discussionCol).setValue(jsonData.discussion[i] || "");
      }
    } else {
      sheet.getRange(nextRow, discussionCol).setValue("");
    }
    
    // Apply time format
    sheet.getRange(nextRow, startTimeCol, totalRows, 1).setNumberFormat("hh:mm AM/PM");
    sheet.getRange(nextRow, endTimeCol, totalRows, 1).setNumberFormat("hh:mm AM/PM");
    
    // Copy template formatting
    SheetService.copyTemplateFormatting(nextRow, totalRows);
    
    // Merge cells
    if (totalRows > 1) {
      sheet.getRange(nextRow, participantCol, totalRows, 1).merge();
      sheet.getRange(nextRow, agendaCol, totalRows, 1).merge();
    }
    
    // Auto-size row height
    SheetService.autoSizeRowHeight(nextRow, endRow, participantsText, discussionCount);
    
    return {
      success: true,
      meetingCode: jsonData.meetingCode,
      startRow: nextRow,
      endRow: endRow,
      message: "✅ Meeting inserted successfully."
    };
    
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Controller Health Check
 */
function aiControllerHealthCheck() {
  Logger.log("================================");
  Logger.log("AI Controller Ready");
  Logger.log("================================");
}
