/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : MeetingCodeEngine.gs
 * Version : 1.0
 * Purpose : Generate Unique Meeting Code
 **********************************************************************/

var MeetingCodeEngine = {};


/**
 * Returns Financial Year Code
 * Example :
 * 2026 -> 2627
 */
MeetingCodeEngine.getFinancialYear = function () {

  var today = new Date();

  var year = today.getFullYear();

  var month = today.getMonth() + 1;

  if (month < 4) {
    year--;
  }

  var startYear = String(year).slice(-2);

  var endYear = String(year + 1).slice(-2);

  return startYear + endYear;

};


/**
 * Returns sequence in 4 digits
 */
MeetingCodeEngine.formatSequence = function (sequence) {

  sequence = Number(sequence);

  var text = String(sequence);

  while (text.length < 4) {

    text = "0" + text;

  }

  return text;

};


/**
 * Generates next meeting code
 */
MeetingCodeEngine.generate = function () {

  var sequence = ConfigService.getNumber("LAST_SEQUENCE", 0);

  var meetingCode = "";

  do {

    sequence++;

    meetingCode =
      CONFIG.MEETING_PREFIX +
      "/" +
      MeetingCodeEngine.getFinancialYear() +
      "/" +
      MeetingCodeEngine.formatSequence(sequence);

  } while (SheetService.meetingExists(meetingCode));

  ConfigService.set("LAST_SEQUENCE", sequence);

  return meetingCode;

};


/**
 * Health Check
 */
function meetingCodeHealthCheck() {

  Logger.log("===== Meeting Code Engine =====");

  Logger.log(
    MeetingCodeEngine.generate()
  );

  Logger.log("Health Check Passed");

}
