/**********************************************************************
 * Legend MOM Management System
 * AIController_AutoInsert.js - Auto Insert Flow (Dual AI Provider)
 * Updated to use callAI() instead of hardcoded callOpenAI()
 **********************************************************************/

function generateAndInsertFromNotes(notes) {
  notes = String(notes || "").trim();
  if (!notes) throw new Error("Meeting notes required.");

  // Build prompt
  var hints = {};
  try {
    hints = parseTimesAndChairFromNotes(notes) || {};
  } catch (e) {
    hints = {};
  }

  var prompt = PromptEngine.build(PromptEngine.TYPES.MOM, notes, hints);

  // Use selected AI provider (Gemini or OpenAI)
  var response = AIFormatter.callAI(prompt);

  var candidateText = null;

  // Handle string response (both Gemini and OpenAI return strings now)
  if (typeof response === "string") {
    candidateText = response;
  }
  // Handle object response.output (legacy)
  else if (response && response.output && Array.isArray(response.output)) {
    try {
      var texts = [];
      response.output.forEach(function (o) {
        if (typeof o === "string") {
          texts.push(o);
        } else if (o.content && Array.isArray(o.content)) {
          o.content.forEach(function (c) {
            if (typeof c === "string") texts.push(c);
            else if (c.type === "output_text" && c.text) texts.push(c.text);
            else if (c.text) texts.push(c.text);
          });
        } else if (o.type === "output_text" && o.text) {
          texts.push(o.text);
        }
      });
      if (texts.length) candidateText = texts.join("\n");
    } catch (e) {
      // continue
    }
  }
  // Handle response.choices (legacy OpenAI)
  else if (response && response.choices && response.choices[0]) {
    var c = response.choices[0];
    if (c.message && c.message.content) candidateText = c.message.content;
    else if (c.text) candidateText = c.text;
  }
  // Handle response.text (legacy)
  else if (response && typeof response.text === 'string') {
    candidateText = response.text;
  }
  // Handle response as object
  else if (response && typeof response === "object") {
    candidateText = JSON.stringify(response);
  }

  if (!candidateText) {
    throw new Error("Could not extract text from AI response.");
  }

  var validation = validateAIResponse(candidateText);
  if (!validation.success) {
    throw new Error("AI response validation failed:\n" + validation.message);
  }

  // Fallback: normalize times & fill missing chairedBy from notes
  var aiData = validation.data || {};

  var parsed = {};
  try {
    parsed = parseTimesAndChairFromNotes(notes) || {};
  } catch (e) {
    parsed = {};
  }

  try {
    if (aiData.startTime) {
      var snorm = convertTo24h(aiData.startTime);
      if (snorm) aiData.startTime = snorm;
    }
    if (aiData.endTime) {
      var enorm = convertTo24h(aiData.endTime);
      if (enorm) aiData.endTime = enorm;
    }

    if ((!aiData.startTime || aiData.startTime === "") && parsed.startTime) {
      aiData.startTime = parsed.startTime;
      aiData.rawStart = parsed.rawStart || parsed.startTime || "";
    } else if (!aiData.rawStart && parsed.rawStart) {
      aiData.rawStart = parsed.rawStart || "";
    }

    if ((!aiData.endTime || aiData.endTime === "") && parsed.endTime) {
      aiData.endTime = parsed.endTime;
      aiData.rawEnd = parsed.rawEnd || parsed.endTime || "";
    } else if (!aiData.rawEnd && parsed.rawEnd) {
      aiData.rawEnd = parsed.rawEnd || "";
    }

    if ((!aiData.chairedBy || aiData.chairedBy === "") && parsed.chairedBy) {
      aiData.chairedBy = parsed.chairedBy;
      aiData.rawChairedBy = parsed.rawChairedBy || parsed.chairedBy || "";
    } else if (!aiData.rawChairedBy && parsed.rawChairedBy) {
      aiData.rawChairedBy = parsed.rawChairedBy || "";
    }

    aiData.startTime = aiData.startTime || "";
    aiData.endTime = aiData.endTime || "";
    aiData.chairedBy = aiData.chairedBy || "";
    aiData.rawStart = aiData.rawStart || "";
    aiData.rawEnd = aiData.rawEnd || "";
    aiData.rawChairedBy = aiData.rawChairedBy || "";
  } catch (e) {
    Logger.log("Fallback parse/apply error: " + e.message);
  }

  Logger.log("AI data after fallback: " + JSON.stringify(aiData, null, 2));

  var result = AIMapper.insert(aiData);

  return {
    success: true,
    meetingCode: result.meetingCode,
    startRow: result.startRow,
    endRow: result.endRow,
    message: "Meeting created successfully.",
  };
}
