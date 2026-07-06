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

function insertValidatedResponse() {
  SpreadsheetApp.getUi()

    .alert("Insert Pipeline will be connected in B4.");
}
