/* VisionClient.js
 * Server-side handlers to process base64 images using Gemini Vision API (primary) 
 * with Drive OCR fallback.
 *
 * Primary: Gemini Vision API - faster, better accuracy, no Drive upload
 * Fallback: Drive OCR - if Gemini rate limited or fails
 * Client fallback: Tesseract.js - if server rate limited
 *
 * Added support for multiple images (concatenate OCR text) and Tesseract.js client-side
 * fallback when Gemini/Drive hit rate limits.
 */

var VisionClient = (function () {
  /**
   * Gemini Vision OCR - primary method
   * Sends base64 image directly to Gemini API for OCR
   */
  function processImageBase64_GeminiVision(base64, fileName) {
    base64 = String(base64 || '');
    if (!base64) throw new Error('Empty image data');

    var apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured. Falling back to Drive OCR.");
    }

    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + apiKey;

    var payload = {
      contents: [
        {
          parts: [
            {
              text: "Extract all text from this image. Return only the extracted text, no commentary."
            },
            {
              inline_data: {
                mime_type: "image/png",
                data: base64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096
      }
    };

    var options = {
      method: "post",
      headers: {
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      var response = UrlFetchApp.fetch(url, options);
      var code = response.getResponseCode();
      var body = response.getContentText();

      // Log for debugging
      Logger.log("[VisionClient] Gemini Vision HTTP " + code);

      // Handle rate limiting
      if (code === 503) {
        throw new Error("Gemini rate limited (503)");
      }

      if (code >= 400) {
        throw new Error("Gemini Vision error (HTTP " + code + "): " + body);
      }

      var data = JSON.parse(body);
      var extractedText = data.candidates && 
                          data.candidates[0] && 
                          data.candidates[0].content && 
                          data.candidates[0].content.parts && 
                          data.candidates[0].content.parts[0] && 
                          data.candidates[0].content.parts[0].text;

      if (!extractedText) {
        throw new Error("No text extracted from image");
      }

      return extractedText;
    } catch (err) {
      Logger.log("[VisionClient] Gemini Vision failed: " + err.message);
      throw err;
    }
  }

  /**
   * Drive OCR implementation (fallback)
   * Uses Drive upload + convert=true to create a Google Doc
   */
  function processImageBase64_DriveOCR(base64, fileName) {
    base64 = String(base64 || '');
    if (!base64) throw new Error('Empty image data');

    var bytes = Utilities.base64Decode(base64);

    var boundary = '-------314159265358979323846';
    var delimiter = '\r\n--' + boundary + '\r\n';
    var closeDelim = '\r\n--' + boundary + '--';

    var metadata = {
      title: fileName || ('ocr-' + new Date().getTime() + '.png'),
      mimeType: 'image/png'
    };

    var multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: image/png\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      Utilities.base64Encode(bytes) +
      closeDelim;

    var url = 'https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart&ocr=true&ocrLanguage=en&convert=true';

    var options = {
      method: 'post',
      contentType: 'multipart/related; boundary=' + boundary,
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      payload: multipartRequestBody,
      muteHttpExceptions: true
    };

    var res = UrlFetchApp.fetch(url, options);
    var code = res.getResponseCode();
    var body = res.getContentText();

    if (code >= 400) {
      throw new Error('Drive OCR failed: HTTP ' + code + ' - ' + body);
    }

    var data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      throw new Error('Drive OCR: invalid JSON response: ' + e.message);
    }

    var docId = data.id;
    if (!docId) {
      throw new Error('Drive OCR produced no document id.');
    }

    try {
      var doc = DocumentApp.openById(docId);
      var text = doc.getBody().getText() || '';
      // Trash the temporary doc to avoid clutter
      try {
        DriveApp.getFileById(docId).setTrashed(true);
      } catch (ignore) {}
      return text;
    } catch (e) {
      throw new Error('Failed to open OCR doc: ' + e.message);
    }
  }

  /**
   * Smart OCR orchestration: Try Gemini first, fallback to Drive
   */
  function processImageBase64_SmartOCR(base64, fileName) {
    var ocrText = '';
    var ocrSource = 'unknown';

    // Try Gemini Vision first (primary)
    try {
      ocrText = processImageBase64_GeminiVision(base64, fileName) || '';
      ocrSource = 'gemini-vision';
      Logger.log("[VisionClient] Gemini Vision succeeded");
      return { text: ocrText, source: ocrSource };
    } catch (geminiErr) {
      Logger.log("[VisionClient] Gemini Vision failed, falling back to Drive OCR: " + geminiErr.message);
    }

    // Fallback to Drive OCR
    try {
      ocrText = processImageBase64_DriveOCR(base64, fileName) || '';
      ocrSource = 'drive-ocr';
      Logger.log("[VisionClient] Drive OCR succeeded");
      return { text: ocrText, source: ocrSource };
    } catch (driveErr) {
      Logger.log("[VisionClient] Drive OCR also failed: " + driveErr.message);
      throw new Error("All OCR methods failed: Gemini - " + geminiErr.message + " | Drive - " + driveErr.message);
    }
  }

  // Extract candidate text from OpenAI-like responses
  function extractCandidateText(response) {
    var candidateText = null;

    if (response && response.output && Array.isArray(response.output)) {
      try {
        var texts = [];
        response.output.forEach(function (o) {
          if (typeof o === 'string') texts.push(o);
          else if (o.content && Array.isArray(o.content)) {
            o.content.forEach(function (c) {
              if (typeof c === 'string') texts.push(c);
              else if (c.type === 'output_text' && c.text) texts.push(c.text);
              else if (c.text) texts.push(c.text);
            });
          } else if (o.type === 'output_text' && o.text) {
            texts.push(o.text);
          }
        });
        if (texts.length) candidateText = texts.join('\n');
      } catch (e) {
        // continue
      }
    }

    if (!candidateText && response && response.choices && response.choices[0]) {
      var c = response.choices[0];
      if (c.message && c.message.content) candidateText = c.message.content;
      else if (c.text) candidateText = c.text;
    }

    if (!candidateText && response && typeof response.text === 'string') {
      candidateText = response.text;
    }

    if (!candidateText && response && typeof response === 'string') {
      candidateText = response;
    }

    return candidateText;
  }

  /**
   * Process single image: Smart OCR -> AI parse -> validate
   */
  function processImageBase64(base64, fileName) {
    base64 = String(base64 || '');
    if (!base64) throw new Error('Empty image data');

    var ocrResult = processImageBase64_SmartOCR(base64, fileName);
    var ocrText = ocrResult.text || '';
    var used = ocrResult.source || 'unknown';

    // Build prompt and call AI (reuse PromptEngine + AIFormatter)
    var prompt = PromptEngine.build(PromptEngine.TYPES.MOM, ocrText || '', {});
    var aiResponse = AIFormatter.callOpenAI(prompt);
    var aiText = extractCandidateText(aiResponse) || '';

    // Validate AI JSON
    var validation = validateAIResponse(aiText);

    return {
      ocrText: ocrText,
      aiText: aiText,
      aiJson: validation.success ? validation.data : null,
      validation: validation,
      ocrSource: used
    };
  }

  /**
   * Process multiple images: Smart OCR for each, concatenate text
   * No AI parsing yet - allows user review before committing
   */
  function processMultipleImagesBase64(imageList) {
    var allOcrText = '';
    var ocrSources = [];

    for (var i = 0; i < imageList.length; i++) {
      var img = imageList[i];
      var ocrResult = processImageBase64_SmartOCR(img.base64, img.name);
      var pageOcr = ocrResult.text || '';
      
      allOcrText += pageOcr;
      ocrSources.push(ocrResult.source);
      
      if (i < imageList.length - 1) {
        allOcrText += '\n---PAGE ' + (i + 1) + '---\n';
      }
    }

    // Return OCR text only (no AI parsing)
    return {
      ocrText: allOcrText,
      aiText: null,
      aiJson: null,
      validation: null,
      ocrSource: ocrSources.join(' + ')
    };
  }

  /**
   * Parse OCR text to JSON
   */
  function parseOcrTextToJson(ocrText) {
    ocrText = String(ocrText || '');
    if (!ocrText) throw new Error('Empty OCR text');

    var prompt = PromptEngine.build(PromptEngine.TYPES.MOM, ocrText, {});
    var aiResponse = AIFormatter.callOpenAI(prompt);
    var aiText = extractCandidateText(aiResponse) || '';

    var validation = validateAIResponse(aiText);

    return {
      ocrText: ocrText,
      aiText: aiText,
      aiJson: validation.success ? validation.data : null,
      validation: validation,
      ocrSource: 'manual-parse'
    };
  }

  return {
    processImageBase64: processImageBase64,
    processImageBase64_GeminiVision: processImageBase64_GeminiVision,
    processImageBase64_DriveOCR: processImageBase64_DriveOCR,
    processImageBase64_SmartOCR: processImageBase64_SmartOCR,
    processMultipleImagesBase64: processMultipleImagesBase64,
    parseOcrTextToJson: parseOcrTextToJson
  };
})();

// Expose top-level functions for google.script.run
function processImageBase64(base64, fileName) {
  return VisionClient.processImageBase64(base64, fileName);
}

function processMultipleImagesBase64(imageList) {
  return VisionClient.processMultipleImagesBase64(imageList);
}

function parseOcrTextToJson(ocrText) {
  return VisionClient.parseOcrTextToJson(ocrText);
}
