/* VisionClient.js
 * Server-side handlers to process base64 images via Cloud Vision API,
 * then call the existing AI flow to parse extracted text into JSON.
 *
 * Added Drive OCR fallback for environments where Cloud Vision is unavailable
 * or billing is not enabled. Drive OCR uses Drive -> Google Docs conversion
 * and does not require Cloud Vision billing.
 */

var VisionClient = (function () {
  function getApiKey() {
    var key = PropertiesService.getScriptProperties().getProperty('VISION_API_KEY');
    if (!key) return null; // do not throw here so we can fallback to Drive OCR
    return key;
  }

  function callVision(base64) {
    var apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('No VISION_API_KEY configured');
    }
    var url = 'https://vision.googleapis.com/v1/images:annotate?key=' + encodeURIComponent(apiKey);
    var payload = {
      requests: [
        {
          image: { content: base64 },
          features: [ { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 } ]
        }
      ]
    };
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    var res = UrlFetchApp.fetch(url, options);
    var code = res.getResponseCode();
    var body = res.getContentText();
    if (code >= 400) {
      throw new Error('Vision API error: ' + body);
    }
    var data = JSON.parse(body);
    var text = '';
    try {
      if (data.responses && data.responses[0]) {
        text = (data.responses[0].fullTextAnnotation && data.responses[0].fullTextAnnotation.text) || (data.responses[0].textAnnotations && data.responses[0].textAnnotations[0] && data.responses[0].textAnnotations[0].description) || '';
      }
    } catch (e) {
      text = '';
    }
    return text;
  }

  // Drive OCR implementation (uses Drive upload + convert=true to create a Google Doc)
  function normalizeMimeType(mimeType) {
    mimeType = String(mimeType || '').trim();
    return /^image\//i.test(mimeType) ? mimeType : 'image/png';
  }

  function processImageBase64_DriveOCR(base64, fileName, mimeType) {
    base64 = String(base64 || '');
    if (!base64) throw new Error('Empty image data');
    mimeType = normalizeMimeType(mimeType);

    var bytes = Utilities.base64Decode(base64);

    var boundary = '-------314159265358979323846';
    var delimiter = '\r\n--' + boundary + '\r\n';
    var closeDelim = '\r\n--' + boundary + '--';

    var metadata = {
      title: fileName || ('upload-' + new Date().getTime() + '.png'),
      mimeType: mimeType
    };

    var multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + mimeType + '\r\n' +
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
      return doc.getBody().getText() || '';
    } catch (e) {
      throw new Error('Failed to open OCR doc: ' + e.message);
    } finally {
      try {
        DriveApp.getFileById(docId).setTrashed(true);
      } catch (ignore) {}
    }
  }

  // Extract candidate text from OpenAI-like responses (same logic as AIController)
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

  // Process base64 -> OCR -> AI parse (return ocrText, aiText, aiJson)
  function processImageBase64(base64, fileName, mimeType) {
    base64 = String(base64 || '');
    if (!base64) throw new Error('Empty image data');

    var ocrText = '';
    var used = 'none';

    // Try Vision API if API key configured
    try {
      if (getApiKey()) {
        try {
          ocrText = callVision(base64) || '';
          used = 'vision';
        } catch (e) {
          Logger.log('Vision API failed, falling back to Drive OCR: ' + e.message);
          // continue to Drive OCR
        }
      }
    } catch (e) {
      // continue to Drive OCR
      Logger.log('Error checking Vision API key: ' + e.message);
    }

    if (!ocrText) {
      // Use Drive OCR fallback
      ocrText = processImageBase64_DriveOCR(base64, fileName, mimeType) || '';
      used = 'drive';
    }

    // 2) Build prompt and call AI (reuse PromptEngine + AIFormatter)
    var prompt = PromptEngine.build(PromptEngine.TYPES.MOM, ocrText || '', {});
    var aiResponse = AIFormatter.callOpenAI(prompt);
    var aiText = extractCandidateText(aiResponse) || '';

    // 3) Validate AI JSON
    var validation = validateAIResponse(aiText);

    return {
      ocrText: ocrText,
      aiText: aiText,
      aiJson: validation.success ? validation.data : null,
      validation: validation,
      ocrSource: used
    };
  }

  return {
    processImageBase64: processImageBase64,
    processImageBase64_DriveOCR: processImageBase64_DriveOCR
  };
})();

// Expose top-level function for google.script.run
function processImageBase64(base64, fileName, mimeType) {
  return VisionClient.processImageBase64(base64, fileName, mimeType);
}
