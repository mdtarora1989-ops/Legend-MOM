/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * File    : AIController_AutoInsert.gs
 * Purpose : Build prompt, call OpenAI, extract JSON, validate and insert
 **********************************************************************/

function generateAndInsertFromNotes(notes) {
  notes = String(notes || "").trim();
  if (!notes) throw new Error("Meeting notes required.");

  var prompt = PromptEngine.build(PromptEngine.TYPES.MOM, notes);

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

  var result = AIMapper.insert(validation.data);

  return {
    success: true,
    meetingCode: result.meetingCode,
    startRow: result.startRow,
    endRow: result.endRow,
    message: "Meeting created successfully.",
  };
}
