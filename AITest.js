function testOpenAIKey() {

  const apiKey = PropertiesService
    .getScriptProperties()
    .getProperty("OPENAI_API_KEY");

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not found.");
  }

  Logger.log("Key Found");
  Logger.log(apiKey.substring(0, 12) + "...");
}