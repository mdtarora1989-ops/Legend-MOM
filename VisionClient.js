/* VisionClient.js
 * Server-side handlers to process base64 images using Drive OCR only (no Cloud Vision).
 *
 * This version forces Drive OCR by uploading the image to Drive with convert=true
 * which creates a Google Doc; the script reads the doc text and trashes the doc.
 * The AI parsing reuses existing PromptEngine + AIFormatter.
 */

var VisionClient = (function () {
  // Drive OCR implementation (uses Drive upload + convert=true to create a Google Doc)
  function processImageBase64_DriveOCR(base64, fileName) {
    base64 = String(base64 || '');
    if (!base64) throw new Error('Empty image data');

    var bytes = Utilities.base64Decode(base64);

    var boundary = '-------314159265358979323846';
    var delimiter = '\r\n--' + boundary + '\r\n';
    var closeDelim = '\r\n--' + boundary + '--';

    var metadata = {
      title: fileName || ('upload-' + new Date().getTime() + '.png'),
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

  // Drive-only process: base64 -> Drive OCR -> AI parse -> validate
  function processImageBase64(base64, fileName) {
    base64 = String(base64 || '');
    if (!base64) throw new Error('Empty image data');

    var ocrText = '';
    var used = 'drive';

    // Force Drive OCR
    ocrText = processImageBase64_DriveOCR(base64, fileName) || '';

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

  return {
    processImageBase64: processImageBase64,
    processImageBase64_DriveOCR: processImageBase64_DriveOCR
  };
})();

// Expose top-level function for google.script.run
function processImageBase64(base64, fileName) {
  return VisionClient.processImageBase64(base64, fileName);
}
