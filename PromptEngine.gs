/***************************************************************
 * Legend MOM Management System
 * -------------------------------------------------------------
 * Module  : PromptEngine.gs
 * Version : 1.1 (tighter + hints)
 * Purpose : Central Prompt Generator
 * CHANGELOG: Accepts optional hints parameter and emits a HINTS block
 ***************************************************************/

const PromptEngine = (() => {
  const TYPES = {
    MOM: "MOM",
    SOP: "SOP",
    KAIZEN: "KAIZEN",
    CAPA: "CAPA",
  };

  function build(type, notes, hints) {
    switch (type) {
      case TYPES.MOM:
        return buildMOM(notes, hints);

      default:
        throw new Error("Unknown Prompt Type : " + type);
    }
  }

  function _formatHints(hints) {
    if (!hints) return "";
    var lines = ["HINTS (optional):"];
    if (hints.startTime) lines.push("- startTime: " + hints.startTime);
    if (hints.endTime) lines.push("- endTime: " + hints.endTime);
    if (hints.chairedBy) lines.push("- chairedBy: " + hints.chairedBy);
    if (hints.rawStart) lines.push("- rawStart: " + hints.rawStart);
    if (hints.rawEnd) lines.push("- rawEnd: " + hints.rawEnd);
    return lines.join("\n") + "\n\n";
  }

  function buildMOM(notes, hints) {
    var hintBlock = _formatHints(hints);
    return `You are an Executive Meeting Minutes Expert.

Convert the following meeting notes into STRICT JSON.

Rules:
- Never invent information.
- Keep chronology.
- Keep action items and owners.
- Keep target dates (if available).
- Normalize times to HH:MM 24-hour format (e.g., 13:30).
- Return ONLY valid JSON — no explanation or surrounding text.

HINTS:
${hintBlock}

JSON Format (exact keys expected):
{
  "meetingDate":"",
  "department":"",
  "startTime":"",
  "endTime":"",
  "chairedBy":"",
  "participants":[],
  "agenda":"",
  "discussion":[
    {
      "topic":"",
      "details":"",
      "action":"",
      "owner":"",
      "targetDate":"",
      "status":"Open"
    }
  ]
}

Meeting Notes:

${notes}`;
  }

  return {
    TYPES,
    build,
  };
})();

function testPromptEngine() {
  const prompt = PromptEngine.build(
    PromptEngine.TYPES.MOM,
    `Production Meeting\n\nExtrusion line speed low\n\nRajesh to improve output by 15%\n\nTarget 30 July`,
    { startTime: '13:30', endTime: '14:30', chairedBy: 'V.B. / V.P. (unclear)' }
  );
  Logger.log(prompt);
}
