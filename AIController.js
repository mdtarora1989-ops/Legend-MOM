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
