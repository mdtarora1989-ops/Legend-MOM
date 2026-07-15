/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : AIController.js
 * Version : 2.3 (Unique Meeting Identifier Check)
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
 * Auto-generate meeting code if missing
 */
function ensureMeetingCode(json) {
  // If meeting code already exists and valid, keep it
  if (json.meetingCode && String(json.meetingCode).trim() !== "") {
    return json;
  }

  // Generate new meeting code
  json.meetingCode = MeetingCodeEngine.generate();
  return json;
}

/**
 * Check for duplicate meeting by unique identifier
 * Unique Key = Date + StartTime + Location + ChairedBy + Agenda
 */
function checkUniqueMeeting(json) {
  
  // Validate required fields
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

  // Check if meeting with same unique identifier already exists
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
 * Insert AI Response (WITH AUTO CODE + UNIQUE MEETING CHECK)
 */
function insertValidatedResponse(text) {
  const validation = validateAIResponse(text);

  if (!validation.success) {
    return validation;
  }

  try {
    // STEP 1: Auto-generate meeting code if missing
    var jsonData = ensureMeetingCode(validation.data);
    
    // STEP 2: Check for duplicate by unique identifier
    checkUniqueMeeting(jsonData);
    
    // STEP 3: Insert only if no duplicate
    const result = AIMapper.insert(jsonData);

    return {
      success: true,

      meetingCode: result.meetingCode,

      startRow: result.startRow,

      endRow: result.endRow,

      message: "✅ Meeting inserted successfully.",
    };
  } catch (error) {
    return {
      success: false,

      message: error.message,
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
