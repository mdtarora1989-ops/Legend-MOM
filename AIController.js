/*************************************************************
 AI Controller
*************************************************************/

function openAIAssistant() {
  SpreadsheetApp.getUi()

    .showSidebar(
      HtmlService.createHtmlOutputFromFile("AISidebar")

        .setTitle("Legend AI Assistant"),
    );
}

function generatePrompt(notes) {
  return PromptEngine.build(PromptEngine.TYPES.MOM, notes);
}
