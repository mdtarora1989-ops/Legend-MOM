/***************************************************************
 * Legend MOM Management System
 * AIFormatter.js - Support for both OpenAI and Gemini APIs
 * Version : 2.6 Enhanced Debugging for Image OCR
 ***************************************************************/

const AIFormatter = (() => {
  const OPENAI_CONFIG = {
    MODEL: "gpt-4o-mini",
    API_URL: "https://api.openai.com/v1/chat/completions",
    MAX_RETRIES: 2,
    TIMEOUT: 30000,
  };

  const GEMINI_CONFIG = {
    MODEL: "gemini-flash-latest",
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
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
   * Safely parse JSON response
   */
  function safeJsonParse(jsonString) {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        throw new Error("Response is not a valid string");
      }
      
      // Remove any BOM or extra whitespace
      const cleaned = jsonString.trim();
      
      if (!cleaned) {
        throw new Error("Response is empty");
      }
      
      return JSON.parse(cleaned);
    } catch (err) {
      log("DEBUG - Raw response (first 300 chars): " + (jsonString ? jsonString.substring(0, 300) : "empty"));
      throw new Error("JSON Parse Error: " + err.message);
    }
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

      const data = safeJsonParse(body);
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
   * Call Gemini API with retry logic
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

    let lastError = null;
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        log("Gemini attempt " + (attempt + 1) + " of " + maxRetries);
        const response = UrlFetchApp.fetch(url, options);
        const code = response.getResponseCode();
        const body = response.getContentText();

        log("Gemini HTTP " + code + " (attempt " + (attempt + 1) + ")");

        // Log response preview for debugging
        log("DEBUG - Gemini response preview (first 300 chars): " + body.substring(0, 300));

        // Handle rate limiting - retry
        if (code === 503) {
          lastError = new Error("Service overloaded (503). Retrying...");
          if (attempt < maxRetries - 1) {
            log("503 error detected, waiting 2 seconds before retry...");
            Utilities.sleep(2000);
            continue;
          }
          throw lastError;
        }

        if (code >= 400) {
          throw new Error("Gemini error (HTTP " + code + "): " + body);
        }

        const data = safeJsonParse(body);
        const content = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
        
        if (!content) {
          throw new Error("Invalid Gemini response structure: " + JSON.stringify(data));
        }
        
        log("Gemini extraction successful, returning content");
        return content;
      } catch (err) {
        lastError = err;
        if (attempt === maxRetries - 1) {
          throw new Error("Gemini Request Failed: " + err.message);
        }
        log("Retry " + (attempt + 1) + " due to: " + err.message);
        Utilities.sleep(2000);
      }
    }

    throw lastError || new Error("Gemini Request Failed: Unknown error");
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
