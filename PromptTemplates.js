/***************************************************************
 * Legend MOM Management System
 * -------------------------------------------------------------
 * Module  : PromptTemplates.js
 * Version : 1.0
 * Purpose : AI Prompt Library
 ***************************************************************/

const PROMPTS = {

  SYSTEM: `
You are an expert Meeting Minutes (MOM) assistant.

Your job is to convert rough meeting notes into a structured
Legend MOM format.

Rules:

1. Never invent information.
2. Keep the original meaning.
3. Preserve chronology.
4. Extract action items.
5. Extract responsible person if mentioned.
6. Extract target dates if available.
7. Return ONLY valid JSON.
`,



  FORMAT: `
Return JSON in this format:

{
  "meetingDate":"",
  "department":"",
  "participants":[
      ""
  ],
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
`,



  OCR: `
The input may contain OCR mistakes.

Correct obvious spelling mistakes only.

Do not change business meaning.
`,



  WHATSAPP: `
The input may come from WhatsApp.

Remove greetings.

Ignore emojis.

Ignore "Good Morning".

Ignore unrelated chat.

Keep only meeting information.
`,



  NOTES: `
The input may be rough handwritten notes.

Organize them into professional MOM language.

Do not add new information.
`

};


/**
 * Returns complete prompt
 */
function buildPrompt(userInput) {

  return [
    PROMPTS.SYSTEM,
    PROMPTS.OCR,
    PROMPTS.WHATSAPP,
    PROMPTS.NOTES,
    PROMPTS.FORMAT,
    "",
    "Meeting Notes:",
    userInput
  ].join("\n\n");

}
function testPromptBuilder() {

  const sample = `
Production meeting

Extrusion line speed low

Virender:
Increase output by 15%

Target:
30 July

Responsible:
Rajesh
`;

  Logger.log(buildPrompt(sample));

}