/**
 * DebugHelpers additions for auto-insert testing
 * Updated to use dual AI provider
 */
function runAutoInsertSample() {
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
    Logger.log('Running auto insert sample using provider: ' + getAIProvider());
    var res = generateAndInsertFromNotes(notes);
    Logger.log('AutoInsert result: ' + JSON.stringify(res, null, 2));
  } catch (e) {
    Logger.log('runAutoInsertSample error: ' + e.message);
  }
}
