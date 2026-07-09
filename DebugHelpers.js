/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * File    : DebugHelpers.gs
 * Purpose : Health checks and quick test helpers
 * CHANGELOG: Added helpers to run health checks and a sample insert tester
 **********************************************************************/

function promptEngineHealthCheck() {
  try {
    Logger.log('=== PromptEngine Health Check ===');
    var hint = { startTime: '13:30', endTime: '14:30', chairedBy: 'V.B. / V.P. (unclear)' };
    var p = PromptEngine.build(PromptEngine.TYPES.MOM, 'SAMPLE NOTES: test', hint);
    Logger.log(p);
    Logger.log('PromptEngine: OK');
  } catch (e) {
    Logger.log('PromptEngine: ERROR - ' + e.message);
  }
}

function healthCheckAll() {
  try {
    Logger.log('=== CONFIG ===');
    configHealthCheck();
  } catch (e) { Logger.log('configHealthCheck error: ' + e.message); }

  try {
    Logger.log('=== SHEET SERVICE ===');
    sheetServiceHealthCheck();
  } catch (e) { Logger.log('sheetServiceHealthCheck error: ' + e.message); }

  try {
    Logger.log('=== PROMPT ENGINE ===');
    promptEngineHealthCheck();
  } catch (e) { Logger.log('promptEngineHealthCheck error: ' + e.message); }

  try {
    Logger.log('=== AI MAPPER ===');
    aiMapperHealthCheck();
  } catch (e) { Logger.log('aiMapperHealthCheck error: ' + e.message); }

  Logger.log('=== HEALTH CHECKS FINISHED ===');
}

function runTestInsertFromNotesSample() {
  var notes = `Meeting: WRM
Date: 30/06/26
Time: 13:30 to 14:30
By: V.B. / V.P. unclear
Attendees: Sumit, Deepak, Vijay ji, Parveen, Rakesh, Sushil ji, Mudt / Mukesh unclear
Points Discussed / Decisions Taken
5S improvement is required in the extrusion area. Guidance/comments were given by Virender Sir.

Civil work related to stone work is pending in the extrusion floor area.

OEE explanation was given by Rakesh Negi.

TPM, meaning Total Plant Maintenance, was discussed. It was explained that OEE is calculated by dividing parts of time, production, and quality.

A roadmap is to be made to reduce the rejection percentage in the bonding process.

A plan is to be prepared for manpower saving in extrusion and bonding.

Mattress 5S audit score checksheet is to be prepared for WRM.

FG employees are to take FG material only between 9:00 AM to 6:00 PM.

Pending task list is to be prepared and shared.`;

  try {
    Logger.log('Running generateAndInsertFromNotes with sample notes...');
    var res = generateAndInsertFromNotes(notes);
    Logger.log('Result: ' + JSON.stringify(res));
  } catch (e) {
    Logger.log('runTestInsertFromNotesSample error: ' + e.message);
  }
}
