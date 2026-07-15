/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : AIController.js
 * Version : 2.5 (TIMEOUT FIX - Async Insert)
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

  // Remove Markdown
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
 * Normalize JSON field names for backward compatibility
 */
function normalizeJSONFields(json) {
  
  if (json.meetingDate && !json.date) {
    json.date = json.meetingDate;
  }
  
  if (json.startingTime && !json.startTime) {
    json.startTime = json.startingTime;
  }
  
  if (json.endingTime && !json.endTime) {
    json.endTime = json.endingTime;
  }
  
  if (json.mType && !json.meetingType) {
    json.meetingType = json.mType;
  }
  
  if (json.chairperson && !json.chairedBy) {
    json.chairedBy = json.chairperson;
  }
  
  if (json.owner && !json.operationOwner) {
    json.operationOwner = json.owner;
  }
  
  return json;
}

/**
 * Auto-generate meeting code if missing
 */
function ensureMeetingCode(json) {
  if (json.meetingCode && String(json.meetingCode).trim() !== "") {
    return json;
  }
  json.meetingCode = MeetingCodeEngine.generate();
  return json;
}

/**
 * Check for duplicate meeting by unique identifier
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
 * MAIN: Insert AI Response
 * Step 1: Validate JSON
 * Step 2: Normalize fields
 * Step 3: Auto-generate code
 * Step 4: Check duplicate
 * Step 5: Insert (with timeout handling)
 */
function insertValidatedResponse(text) {
  
  // Step 1: Parse & Validate JSON
  var validation = validateAIResponse(text);
  if (!validation.success) {
    return validation;
  }

  try {
    // Step 2: Normalize field names
    var jsonData = normalizeJSONFields(validation.data);
    
    // Step 3: Auto-generate code
    jsonData = ensureMeetingCode(jsonData);
    
    // Step 4: Check for duplicates
    checkUniqueMeeting(jsonData);
    
    // Step 5: Insert meeting
    // Direct insert - no wrapper functions that cause timeout
    var sheet = SheetService.getSheet();
    var nextRow = SheetService.getNextInsertRow();
    
    // Get number of discussion points to know how many rows needed
    var discussionCount = (jsonData.discussion && Array.isArray(jsonData.discussion)) 
      ? jsonData.discussion.length 
      : 1;
    
    if (discussionCount < 1) discussionCount = 1;
    
    var totalRows = discussionCount;
    var endRow = nextRow + totalRows - 1;
    
    // Insert rows
    if (totalRows > 1) {
      SheetService.insertRows(nextRow, totalRows - 1);
    }
    
    // Copy formatting
    SheetService.copyTemplateFormatting(nextRow, totalRows);
    
    // Write meeting data
    InsertEngine.writeMeetingData(jsonData, {
      sheet: sheet,
      startRow: nextRow,
      endRow: endRow,
      totalRows: totalRows,
      lastColumn: SheetService.getLastColumn(),
      templateRow: SheetService.getTemplateRow()
    });
    
    // Merge cells
    SheetService.mergeMeeting(nextRow, discussionCount);
    
    // Auto-size row height
    var participantsText = (jsonData.participants && Array.isArray(jsonData.participants))
      ? jsonData.participants.map(function(p) { return p.name || ""; }).join(", ")
      : "";
    
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
