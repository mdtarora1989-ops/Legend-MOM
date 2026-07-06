/*************************************************************
 AI Controller
*************************************************************/

function openAIAssistant(){

SpreadsheetApp.getUi()

.showSidebar(

HtmlService

.createHtmlOutputFromFile("AIWorkspace")

.setTitle("Legend AI Workspace")

);

}

function generatePrompt(notes) {
  return PromptEngine.build(PromptEngine.TYPES.MOM, notes);
}
