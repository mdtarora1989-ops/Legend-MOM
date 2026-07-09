/***************************************************************
 * Legend MOM Management System
 * AIFormatter.js - Support for both OpenAI and Gemini APIs
 * Version : 2.0 Dual Provider
 ***************************************************************/

const AIFormatter = (() => {
  const OPENAI_CONFIG = {
    MODEL: "gpt-4o-mini",
    API_URL: "https://api.openai.com/v1/chat/completions",
    MAX_RETRIES: 2,
    TIMEOUT: 30000,
  };

  const GEMINI_CONFIG = {
    MODEL: "gemini-1.5-flash",
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    MAX_RETRIES: 2,
    TIMEOUT: 30000,
  };

  /**
   * Get OpenAI API Key from Script Properties
   */
  function getOpenAIKey() {
    const key = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
    if (!key) {
      throw new Error("OPENAI_API_KEY not configured.");
    }
    return key;
  }

  /**
   * Get Gemini API Key from Script Properties
   */
  function getGeminiKey() {
    const key = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
    if (!key) {
      throw new Error("GEMINI_API_KEY not configured.");
    }
    return key;
  }

  /**
   * Build OpenAI request
   */
  function buildOpenAIRequest(prompt) {
    return {
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    };
  }

  /**
   * Build Gemini request
   */
  function buildGeminiRequest(prompt) {
    return {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048
      }
    };
  }

  /**
   * Call OpenAI API
   */
  function callOpenAI(prompt) {
    const apiKey = getOpenAIKey();
    const payload = buildOpenAIRequest(prompt);

    const options = {
      method: "post",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    try {
      const response = UrlFetchApp.fetch(OPENAI_CONFIG.API_URL, options);
      const code = response.getResponseCode();
      const body = response.getContentText();

      log("OpenAI HTTP " + code);

      if (code >= 400) {
        throw new Error("OpenAI error: " + body);
      }

      const data = JSON.parse(body);
      const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!content) {
        throw new Error("Invalid OpenAI response structure");
      }
      return content;
    } catch (err) {
      throw new Error("OpenAI Request Failed: " + err.message);
    }
  }

  /**
   * Call Gemini API
   */
  function callGemini(prompt) {
    const apiKey = getGeminiKey();
    const payload = buildGeminiRequest(prompt);
    const url = GEMINI_CONFIG.API_URL + "?key=" + apiKey;

    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const code = response.getResponseCode();
      const body = response.getContentText();

      log("Gemini HTTP " + code);

      if (code >= 400) {
        throw new Error("Gemini error: " + body);
      }

      const data = JSON.parse(body);
      const content = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
      if (!content) {
        throw new Error("Invalid Gemini response structure");
      }
      return content;
    } catch (err) {
      throw new Error("Gemini Request Failed: " + err.message);
    }
  }

  /**
   * Call appropriate AI provider based on config
   */
  function callAI(prompt) {
    const provider = getAIProvider();
    log("Using AI Provider: " + provider);

    if (provider === "gemini") {
      return callGemini(prompt);
    } else if (provider === "openai") {
      return callOpenAI(prompt);
    } else {
      throw new Error("Unknown AI provider: " + provider);
    }
  }

  /**
   * Generic Logger
   */
  function log(message) {
    Logger.log("[AIFormatter] " + message);
  }

  return {
    OPENAI_CONFIG,
    GEMINI_CONFIG,
    getOpenAIKey,
    getGeminiKey,
    buildOpenAIRequest,
    buildGeminiRequest,
    callOpenAI,
    callGemini,
    callAI,
    log,
  };
})();

/**
 * Legacy wrapper for backward compatibility
 */
function callOpenAI(prompt) {
  return AIFormatter.callAI(prompt);
}

function testAIFormatterDualProvider() {
  const provider = getAIProvider();
  Logger.log("Current AI Provider: " + provider);
  const prompt = "Reply only with the word SUCCESS.";
  try {
    const response = AIFormatter.callAI(prompt);
    Logger.log("Response: " + response);
  } catch (err) {
    Logger.log("Error: " + err.message);
  }
}
