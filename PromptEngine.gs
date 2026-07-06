/***************************************************************
 * Legend MOM Management System
 * -------------------------------------------------------------
 * Module  : PromptEngine.gs
 * Version : 1.0
 * Purpose : Central Prompt Generator
 ***************************************************************/

const PromptEngine = (() => {
  const TYPES = {
    MOM: "MOM",

    SOP: "SOP",

    KAIZEN: "KAIZEN",

    CAPA: "CAPA",
  };

  function build(type, notes) {
    switch (type) {
      case TYPES.MOM:
        return buildMOM(notes);

      default:
        throw new Error("Unknown Prompt Type : " + type);
    }
  }

  function buildMOM(notes) {
    return `
You are an Executive Meeting Minutes Expert.

Convert the following meeting notes into STRICT JSON.

Rules

• Never invent information.
• Keep chronology.
• Keep action items.
• Keep owner.
• Keep target dates.
• Status = Open.
• Return ONLY JSON.

JSON Format

{
"meetingDate":"",
"department":"",
"participants":[],
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

Meeting Notes

${notes}
`;
  }

  return {
    TYPES,

    build,
  };
})();
function testPromptEngine() {
  const prompt = PromptEngine.build(
    PromptEngine.TYPES.MOM,

    `
Production Meeting

Extrusion line speed low

Rajesh to improve output by 15%

Target 30 July
`,
  );

  Logger.log(prompt);
}
