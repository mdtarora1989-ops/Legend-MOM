/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : AIController.js
 * Version : 2.0
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
 * Insert AI Response
 */
function insertValidatedResponse(text) {
  const validation = validateAIResponse(text);

  if (!validation.success) {
    return validation;
  }

  try {
    const result = AIMapper.insert(validation.data);

    return {
      success: true,

      meetingCode: result.meetingCode,

      startRow: result.startRow,

      endRow: result.endRow,

      message: "Meeting inserted successfully.",
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
