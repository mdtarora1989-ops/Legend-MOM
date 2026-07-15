/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : AIController.js
 * Version : 2.1 (Enhanced Duplicate Prevention)
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
 * Pre-Insert Duplicate Check (ENHANCED)
 */
function checkDuplicateMeeting(json) {
  // Extract meeting code from JSON
  var meetingCode = String(json.meetingCode || "").trim();
  
  if (meetingCode === "") {
    throw new Error("Meeting code is missing from JSON.");
  }

  // Check in sheet
  if (SheetService.meetingExists(meetingCode)) {
    throw new Error(
      "❌ DUPLICATE DETECTED!\n\n" +
      "Meeting Code: " + meetingCode + " already exists in the sheet.\n\n" +
      "Please use a different meeting code or verify your JSON."
    );
  }

  return true;
}

/**
 * Insert AI Response (WITH ENHANCED DUPLICATE PREVENTION)
 */
function insertValidatedResponse(text) {
  const validation = validateAIResponse(text);

  if (!validation.success) {
    return validation;
  }

  try {
    // STEP 1: Pre-insert duplicate check
    checkDuplicateMeeting(validation.data);
    
    // STEP 2: Insert only if no duplicate
    const result = AIMapper.insert(validation.data);

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
