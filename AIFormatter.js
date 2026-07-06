/***************************************************************
 * Legend MOM Management System
 * -------------------------------------------------------------
 * Module  : AIFormatter.js
 * Version : 1.0 Foundation
 * Purpose : OpenAI Integration Engine
 ***************************************************************/

const AIFormatter = (() => {
  const CONFIG = {
    MODEL: "gpt-5.1",

    API_URL: "https://api.openai.com/v1/responses",

    MAX_RETRIES: 2,

    TIMEOUT: 30000,
  };

  /**
   * Returns API Key from Script Properties
   */
  function getApiKey() {
    const key =
      PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

    if (!key) {
      throw new Error("OPENAI_API_KEY not configured.");
    }

    return key;
  }

  /**
   * Creates HTTP Headers
   */
  function buildHeaders() {
    return {
      Authorization: "Bearer " + getApiKey(),

      "Content-Type": "application/json",
    };
  }

  /**
   * Creates OpenAI Request
   */
  function buildRequest(prompt) {
    return {
      model: CONFIG.MODEL,

      input: prompt,
    };
  }
  /**
   * Calls OpenAI Responses API
   */
  function callOpenAI(prompt) {
    const payload = buildRequest(prompt);

    const options = {
      method: "post",

      headers: buildHeaders(),

      payload: JSON.stringify(payload),

      muteHttpExceptions: true,
    };

    try {
      const response = UrlFetchApp.fetch(CONFIG.API_URL, options);

      const code = response.getResponseCode();

      const body = response.getContentText();

      log("HTTP " + code);

      if (code >= 400) {
        throw new Error(body);
      }

      return JSON.parse(body);
    } catch (err) {
      throw new Error("OpenAI Request Failed\n\n" + err.message);
    }
  }

  /**
   * Generic Logger
   */
  function log(message) {
    Logger.log("[AIFormatter] " + message);
  }

  return {
    CONFIG,

    getApiKey,

    buildHeaders,

    buildRequest,

    callOpenAI,

    log,
  };
})();
function testAIFormatterFoundation() {
  const request = AIFormatter.buildRequest("Hello AI");

  Logger.log(request);
}
function testOpenAIConnection() {
  const prompt = "Reply only with the word SUCCESS.";

  const response = AIFormatter.callOpenAI(prompt);

  Logger.log(JSON.stringify(response, null, 2));
}
