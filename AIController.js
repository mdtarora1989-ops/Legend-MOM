/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : AIController.js
 * Version : 2.2 (Auto Meeting Code Generation)
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
 * Pre-Insert Duplicate Check (ENHANCED)
 */
function checkDuplicateMeeting(json) {
  // Extract meeting code from JSON
  var meetingCode = String(json.meetingCode || "").trim();
  
  if (meetingCode === "") {
    throw new Error("Meeting code generation failed.");
  }

  // Check in sheet
  if (SheetService.meetingExists(meetingCode)) {
    throw new Error(
      "❌ DUPLICATE DETECTED!\n\n" +
      "Meeting Code: " + meetingCode + " already exists in the sheet.\n\n" +
      "Please try again - a new meeting code will be generated."
    );
  }

  return true;
}

/**
 * Insert AI Response (WITH AUTO MEETING CODE + DUPLICATE PREVENTION)
 */
function insertValidatedResponse(text) {
  const validation = validateAIResponse(text);

  if (!validation.success) {
    return validation;
  }

  try {
    // STEP 1: Auto-generate meeting code if missing
    var jsonData = ensureMeetingCode(validation.data);
    
    // STEP 2: Pre-insert duplicate check
    checkDuplicateMeeting(jsonData);
    
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
