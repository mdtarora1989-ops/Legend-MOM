/* VisionClient.js
 * Server-side handlers to process base64 images via Cloud Vision API,
 * then call the existing AI flow to parse extracted text into JSON.
 */

var VisionClient = (function () {
  function getApiKey() {
    var key = PropertiesService.getScriptProperties().getProperty('VISION_API_KEY');
    if (!key) throw new Error('VISION_API_KEY not configured in Script Properties.');
    return key;
  }

  function callVision(base64) {
    var apiKey = getApiKey();
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
  function processImageBase64(base64, fileName) {
    base64 = String(base64 || '');
    if (!base64) throw new Error('Empty image data');

    // 1) Call Vision API
    var ocrText = '';
    try {
      ocrText = callVision(base64) || '';
    } catch (e) {
      throw new Error('Vision OCR failed: ' + e.message);
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
      validation: validation
    };
  }

  return {
    processImageBase64: processImageBase64
  };
})();

// Expose top-level function for google.script.run
function processImageBase64(base64, fileName) {
  return VisionClient.processImageBase64(base64, fileName);
}
