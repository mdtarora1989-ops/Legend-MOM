/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * File    : AIController_AutoInsert.gs
 * Purpose : Build prompt, call OpenAI, extract JSON, validate and insert
 * CHANGELOG: Added fallback to normalize times and fill chairedBy from notes.
 **********************************************************************/

function generateAndInsertFromNotes(notes) {
  notes = String(notes || "").trim();
  if (!notes) throw new Error("Meeting notes required.");

  // Build prompt (we pass notes; parseHints optional)
  var hints = {};
  try {
    hints = parseTimesAndChairFromNotes(notes) || {};
  } catch (e) {
    hints = {};
  }

  var prompt = PromptEngine.build(PromptEngine.TYPES.MOM, notes, hints);

  var response = AIFormatter.callOpenAI(prompt);

  var candidateText = null;

  // 1) Responses API style: response.output
  if (response && response.output && Array.isArray(response.output)) {
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

  // 2) Chat completions / choices
  if (!candidateText && response && response.choices && response.choices[0]) {
    var c = response.choices[0];
    if (c.message && c.message.content) candidateText = c.message.content;
    else if (c.text) candidateText = c.text;
  }

  // 3) If response has 'text' at root
  if (!candidateText && response && typeof response.text === 'string') {
    candidateText = response.text;
  }

  // 4) Fallback: if response is string
  if (!candidateText && response && typeof response === "string") {
    candidateText = response;
  }

  if (!candidateText) {
    throw new Error("Could not extract text from AI response.");
  }

  var validation = validateAIResponse(candidateText);
  if (!validation.success) {
    throw new Error("AI response validation failed:\n" + validation.message);
  }

  // --- Fallback: normalize times & fill missing chairedBy from notes ---
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
