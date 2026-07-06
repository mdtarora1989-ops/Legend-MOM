/***************************************************************
 * Legend MOM Management System
 * -------------------------------------------------------------
 * Module : PromptBuilder.js
 * Purpose: Generates AI Prompt
 ***************************************************************/

const PromptBuilder = (() => {

  function build(notes) {

    return `
You are working as an Executive Meeting Minutes Specialist.

Convert the following rough meeting notes into JSON.

Rules

1. Do NOT invent information.
2. Keep chronology.
3. Keep action items.
4. Keep owner.
5. Keep target date.
6. Status = Open by default.

Return ONLY JSON.

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

    build

  };

})();
function testPromptBuilderV2(){

const prompt =
PromptBuilder.build(
`
Production Meeting

Extrusion speed low

Rajesh to increase speed by 15%

Target 30 July
`);

Logger.log(prompt);

}