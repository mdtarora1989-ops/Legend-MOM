/*************************************************************
 AI Controller
*************************************************************/

function openAIAssistant() {
  const template = HtmlService.createTemplateFromFile("AIWorkspace");

  SpreadsheetApp.getUi().showSidebar(
    template.evaluate().setTitle("Legend AI Workspace"),
  );
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
function validateAIResponse(text) {
  text = text.trim();

  text = text.replace(/^```json/i, "");

  text = text.replace(/^```/i, "");

  text = text.replace(/```$/, "");

  const obj = JSON.parse(text);

  return {
    message: "JSON Valid",

    preview: JSON.stringify(obj, null, 2),
  };
}

/**********************************************************************
 * Inserts AI Response into MOM
 **********************************************************************/
function insertValidatedResponse(aiResponse) {
  try {
    var text = String(aiResponse || "").trim();

    // Remove Markdown code fences
    text = text.replace(/^```json\s*/i, "");
    text = text.replace(/^```\s*/i, "");
    text = text.replace(/\s*```$/, "");

    var json = JSON.parse(text);

    var result = AIMapper.insert(json);

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
