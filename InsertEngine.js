/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : InsertEngine.gs
 * Version : 3.0 Final
 * Part    : 1 of 5
 * Purpose : Insert Preparation Engine
 **********************************************************************/

var InsertEngine = {};


/**********************************************************************
 * Returns required rows.
 **********************************************************************/
InsertEngine.calculateRequiredRows = function (mom) {

  var rows = MOMBuilder.getDiscussionCount(mom);

  if (rows < 1) {
    rows = 1;
  }

  return rows;

};


/**********************************************************************
 * Returns first blank block.
 *
 * Returns
 * {
 *    startRow,
 *    endRow
 * }
 **********************************************************************/
InsertEngine.findAvailableBlock = function (requiredRows) {

  var sheet = SheetService.getSheet();

  var meetingColumn = SheetService.column("MEETING_CODE");

  var firstRow = CONFIG.FIRST_DATA_ROW;

  var lastRow = sheet.getLastRow();

  if (lastRow < firstRow) {

    return {

      startRow: firstRow,

      endRow: firstRow + requiredRows - 1

    };

  }

  var values = sheet.getRange(

      firstRow,
      meetingColumn,
      lastRow - firstRow + 1,
      1

  ).getValues();

  for (var i = 0; i < values.length; i++) {

    if (String(values[i][0]).trim() !== "") {
      continue;
    }

    var available = true;

    for (var j = 0; j < requiredRows; j++) {

      var index = i + j;

      if (index >= values.length) {
        break;
      }

      if (String(values[index][0]).trim() !== "") {

        available = false;

        break;

      }

    }

    if (available) {

      return {

        startRow: firstRow + i,

        endRow: firstRow + i + requiredRows - 1

      };

    }

  }

  return {

    startRow: lastRow + 1,

    endRow: lastRow + requiredRows

  };

};


/**********************************************************************
 * Creates Transaction Context
 **********************************************************************/
InsertEngine.createContext = function (mom) {

  var rows = InsertEngine.calculateRequiredRows(mom);

  var block = InsertEngine.findAvailableBlock(rows);

  return {

    sheet: SheetService.getSheet(),

    startRow: block.startRow,

    endRow: block.endRow,

    totalRows: rows,

    lastColumn: SheetService.getLastColumn(),

    templateRow: SheetService.getTemplateRow()

  };

};


/**********************************************************************
 * Validation
 **********************************************************************/
InsertEngine.validate = function (mom) {

  if (!MOMBuilder.isValid(mom)) {

    throw new Error(
      "Invalid MOM Object."
    );

  }

  if (

    SheetService.meetingExists(

      mom.meetingCode

    )

  ) {

    throw new Error(

      "Meeting already exists : "

      + mom.meetingCode

    );

  }

};


/**********************************************************************
 * Creates Insert Transaction
 **********************************************************************/
InsertEngine.prepare = function (mom) {

  InsertEngine.validate(mom);

  return InsertEngine.createContext(mom);

};


/**********************************************************************
 * Creates Header Template Row
 **********************************************************************/
InsertEngine.buildHeaderRow = function (mom, ctx) {

  var row = new Array(ctx.lastColumn);

  row[SheetService.column("DATE") - 1] = mom.date;

  row[SheetService.column("START_TIME") - 1] = mom.startTime;

  row[SheetService.column("END_TIME") - 1] = mom.endTime;

  row[SheetService.column("MEETING_CODE") - 1] = mom.meetingCode;

  row[SheetService.column("MEETING_TYPE") - 1] = mom.meetingType;

  row[SheetService.column("LOCATION") - 1] = mom.location;

  row[SheetService.column("CHAIRED_BY") - 1] = mom.chairedBy;

  row[SheetService.column("RECORD") - 1] = mom.recordStatus;

  return row;

};


/**********************************************************************
 * Health Check
 **********************************************************************/
function insertEnginePart1HealthCheck() {

  var mom = MOMBuilder.create();

  mom.date = "05/07/2026";

  mom.startTime = "07:00";

  mom.endTime = "07:20";

  mom.meetingCode = MeetingCodeEngine.generate();

  mom.chairedBy = "Mudit Arora";

  mom.agenda = "Morning Meeting";

  MOMBuilder.addParticipant(
    mom,
    "Rakesh Negi"
  );

  MOMBuilder.addDiscussion(
    mom,
    "Safety"
  );

  var ctx = InsertEngine.prepare(mom);

  Logger.log("========== InsertEngine ==========");

  Logger.log("Start Row : " + ctx.startRow);

  Logger.log("End Row   : " + ctx.endRow);

  Logger.log("Rows      : " + ctx.totalRows);

  Logger.log("==================================");

}
/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : InsertEngine.gs
 * Version : 3.0 Final
 * Part    : 2 of 5
 * Purpose : Data Writer Engine
 **********************************************************************/


/**********************************************************************
 * Writes Header Data
 **********************************************************************/
InsertEngine.writeHeaderData = function (mom, ctx) {

  var template = InsertEngine.buildHeaderRow(mom, ctx);

  var rows = [];

  for (var i = 0; i < ctx.totalRows; i++) {

    rows.push(template.slice());

  }

  ctx.sheet.getRange(

      ctx.startRow,
      1,
      ctx.totalRows,
      ctx.lastColumn

  ).setValues(rows);

};


/**********************************************************************
 * Writes Discussion Column
 **********************************************************************/
InsertEngine.writeDiscussionData = function (mom, ctx) {

  if (mom.discussion.length === 0) {

    return;

  }

  var discussionColumn = SheetService.column("DISCUSSION");

  var values = [];

  for (var i = 0; i < mom.discussion.length; i++) {

    values.push([

      mom.discussion[i]

    ]);

  }

  ctx.sheet.getRange(

      ctx.startRow,
      discussionColumn,
      values.length,
      1

  ).setValues(values);

};


/**********************************************************************
 * Writes Participants
 **********************************************************************/
InsertEngine.writeParticipantData = function (mom, ctx) {

  var participantColumn = SheetService.column("PARTICIPANTS");

  ctx.sheet.getRange(

      ctx.startRow,
      participantColumn,
      1,
      1

  ).setValue(

      MOMBuilder.getParticipantsText(mom)

  );

};


/**********************************************************************
 * Writes Agenda
 **********************************************************************/
InsertEngine.writeAgendaData = function (mom, ctx) {

  var agendaColumn = SheetService.column("AGENDA");

  ctx.sheet.getRange(

      ctx.startRow,
      agendaColumn,
      1,
      1

  ).setValue(

      mom.agenda

  );

};


/**********************************************************************
 * Writes Record Status
 **********************************************************************/
InsertEngine.writeRecordStatus = function (mom, ctx) {

  var recordColumn = SheetService.column("RECORD");

  ctx.sheet.getRange(

      ctx.startRow,
      recordColumn,
      ctx.totalRows,
      1

  ).setValue(

      mom.recordStatus

  );

};


/**********************************************************************
 * Writes Complete Meeting Data
 **********************************************************************/
InsertEngine.writeMeetingData = function (mom, ctx) {

  InsertEngine.writeHeaderData(

      mom,
      ctx

  );

  InsertEngine.writeDiscussionData(

      mom,
      ctx

  );

  InsertEngine.writeParticipantData(

      mom,
      ctx

  );

  InsertEngine.writeAgendaData(

      mom,
      ctx

  );

  InsertEngine.writeRecordStatus(

      mom,
      ctx

  );

};


/**********************************************************************
 * Part-2 Health Check
 **********************************************************************/
function insertEnginePart2HealthCheck() {

  var mom = MOMBuilder.create();

  mom.date = "05/07/2026";

  mom.startTime = "07:00";

  mom.endTime = "07:20";

  mom.meetingCode = MeetingCodeEngine.generate();

  mom.meetingType = CONFIG.DEFAULT_MEETING_TYPE;

  mom.location = CONFIG.DEFAULT_LOCATION;

  mom.chairedBy = "Mudit Arora";

  mom.agenda = "Daily Production Review";

  MOMBuilder.addParticipant(

      mom,

      "Rakesh Negi"

  );

  MOMBuilder.addParticipant(

      mom,

      "Lohansh Sehgal"

  );

  MOMBuilder.addParticipant(

      mom,

      "Yogesh Sharma"

  );

  MOMBuilder.addDiscussion(

      mom,

      "Safety"

  );

  MOMBuilder.addDiscussion(

      mom,

      "Production"

  );

  MOMBuilder.addDiscussion(

      mom,

      "Quality"

  );

  var ctx = InsertEngine.prepare(

      mom

  );

  InsertEngine.writeMeetingData(

      mom,

      ctx

  );

  Logger.log("InsertEngine Part-2 PASS");

}
/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : InsertEngine.gs
 * Version : 3.0 Final
 * Part    : 3 of 5
 * Purpose : Transaction & Formatting Engine
 **********************************************************************/


/**********************************************************************
 * Ensures sufficient rows exist.
 **********************************************************************/
InsertEngine.ensureRows = function (ctx) {

  var lastRow = ctx.sheet.getLastRow();

  if (ctx.endRow <= lastRow) {
    return;
  }

  SheetService.insertRows(
    lastRow,
    ctx.endRow - lastRow
  );

};


/**********************************************************************
 * Applies template formatting.
 **********************************************************************/
InsertEngine.applyTemplate = function (ctx) {

  SheetService.copyTemplateFormatting(
    ctx.startRow,
    ctx.totalRows
  );

};


/**********************************************************************
 * Removes existing merge.
 **********************************************************************/
InsertEngine.unmergeArea = function (ctx) {

  SheetService.unmergeMeeting(
    ctx.startRow,
    ctx.totalRows
  );

};


/**********************************************************************
 * Applies required merge.
 **********************************************************************/
InsertEngine.mergeArea = function (ctx) {

  SheetService.mergeMeeting(
    ctx.startRow,
    ctx.totalRows
  );

};


/**********************************************************************
 * Executes complete write transaction.
 **********************************************************************/
InsertEngine.execute = function (mom, ctx) {

  InsertEngine.ensureRows(ctx);

  InsertEngine.applyTemplate(ctx);

  InsertEngine.unmergeArea(ctx);

  InsertEngine.writeMeetingData(
    mom,
    ctx
  );

  InsertEngine.mergeArea(ctx);

};


/**********************************************************************
 * Returns Transaction Result.
 **********************************************************************/
InsertEngine.buildResult = function (mom, ctx) {

  return {

    success: true,

    meetingCode: mom.meetingCode,

    startRow: ctx.startRow,

    endRow: ctx.endRow,

    totalRows: ctx.totalRows

  };

};


/**********************************************************************
 * Main Insert API
 **********************************************************************/
InsertEngine.insert = function (mom) {

  var ctx = InsertEngine.prepare(mom);

  InsertEngine.execute(
    mom,
    ctx
  );

  return InsertEngine.buildResult(
    mom,
    ctx
  );

};


/**********************************************************************
 * Transaction Health Check
 **********************************************************************/
function insertEnginePart3HealthCheck() {

  var mom = MOMBuilder.create();

  mom.date = "05/07/2026";
  mom.startTime = "07:00";
  mom.endTime = "07:20";

  mom.meetingCode = MeetingCodeEngine.generate();

  mom.meetingType = CONFIG.DEFAULT_MEETING_TYPE;

  mom.location = CONFIG.DEFAULT_LOCATION;

  mom.chairedBy = "Mudit Arora";

  mom.agenda = "Morning Review";

  MOMBuilder.addParticipant(
    mom,
    "Rakesh Negi"
  );

  MOMBuilder.addParticipant(
    mom,
    "Lohansh Sehgal"
  );

  MOMBuilder.addDiscussion(
    mom,
    "Safety"
  );

  MOMBuilder.addDiscussion(
    mom,
    "Production"
  );

  MOMBuilder.addDiscussion(
    mom,
    "Quality"
  );

  var result = InsertEngine.insert(
    mom
  );

  Logger.log("================================");

  Logger.log("InsertEngine Part-3 PASS");

  Logger.log("Meeting Code : " + result.meetingCode);

  Logger.log("Start Row    : " + result.startRow);

  Logger.log("End Row      : " + result.endRow);

  Logger.log("Rows         : " + result.totalRows);

  Logger.log("================================");

}
/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : InsertEngine.gs
 * Version : 3.0 Final
 * Part    : 4 of 5
 * Purpose : Logging & Utility Engine
 **********************************************************************/


/**********************************************************************
 * Builds Insert Summary
 **********************************************************************/
InsertEngine.getSummary = function (mom, ctx) {

  return {

    meetingCode: mom.meetingCode,

    meetingType: mom.meetingType,

    chairedBy: mom.chairedBy,

    participants: mom.participants.length,

    discussionPoints: MOMBuilder.getDiscussionCount(mom),

    startRow: ctx.startRow,

    endRow: ctx.endRow,

    totalRows: ctx.totalRows

  };

};


/**********************************************************************
 * Logs Insert Summary
 **********************************************************************/
InsertEngine.logSummary = function (summary) {

  Logger.log("========================================");
  Logger.log("Legend MOM Insert Summary");
  Logger.log("----------------------------------------");
  Logger.log("Meeting Code      : " + summary.meetingCode);
  Logger.log("Meeting Type      : " + summary.meetingType);
  Logger.log("Chaired By        : " + summary.chairedBy);
  Logger.log("Participants      : " + summary.participants);
  Logger.log("Discussion Points : " + summary.discussionPoints);
  Logger.log("Start Row         : " + summary.startRow);
  Logger.log("End Row           : " + summary.endRow);
  Logger.log("Rows Used         : " + summary.totalRows);
  Logger.log("========================================");

};


/**********************************************************************
 * Safe Insert Wrapper
 **********************************************************************/
InsertEngine.safeInsert = function (mom) {

  try {

    var result = InsertEngine.insert(mom);

    var ctx = {

      startRow: result.startRow,

      endRow: result.endRow,

      totalRows: result.totalRows

    };

    InsertEngine.logSummary(

      InsertEngine.getSummary(
        mom,
        ctx
      )

    );

    return result;

  } catch (error) {

    Logger.log("========================================");
    Logger.log("InsertEngine FAILED");
    Logger.log(error.message);
    Logger.log("========================================");

    throw error;

  }

};


/**********************************************************************
 * Creates Sample MOM
 * Useful for Testing
 **********************************************************************/
InsertEngine.createSampleMeeting = function () {

  var mom = MOMBuilder.create();

  mom.date = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "dd/MM/yyyy"
  );

  mom.startTime = "07:00";

  mom.endTime = "07:20";

  mom.meetingCode = MeetingCodeEngine.generate();

  mom.meetingType = CONFIG.DEFAULT_MEETING_TYPE;

  mom.location = CONFIG.DEFAULT_LOCATION;

  mom.chairedBy = "System";

  mom.agenda = "Daily Morning Meeting";

  MOMBuilder.addParticipant(
      mom,
      "Participant 1"
  );

  MOMBuilder.addParticipant(
      mom,
      "Participant 2"
  );

  MOMBuilder.addDiscussion(
      mom,
      "Safety"
  );

  MOMBuilder.addDiscussion(
      mom,
      "Production"
  );

  MOMBuilder.addDiscussion(
      mom,
      "Quality"
  );

  return mom;

};


/**********************************************************************
 * Part-4 Health Check
 **********************************************************************/
function insertEnginePart4HealthCheck() {

  var mom = InsertEngine.createSampleMeeting();

  var result = InsertEngine.safeInsert(mom);

  Logger.log("========================================");
  Logger.log("InsertEngine Part-4 PASS");
  Logger.log("Meeting : " + result.meetingCode);
  Logger.log("========================================");

}
/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : InsertEngine.gs
 * Version : 3.0 Final
 * Part    : 5 of 5
 * Purpose : Final Validation & Test Suite
 **********************************************************************/


/**********************************************************************
 * Checks whether InsertEngine is ready.
 **********************************************************************/
InsertEngine.isReady = function () {

  if (!SheetService.getSheet()) {

    return false;

  }

  return true;

};


/**********************************************************************
 * Runs complete insert process.
 *
 * Public API
 **********************************************************************/
InsertEngine.run = function (mom) {

  if (!InsertEngine.isReady()) {

    throw new Error(
      "InsertEngine is not ready."
    );

  }

  return InsertEngine.safeInsert(mom);

};


/**********************************************************************
 * Creates Demo Meeting
 **********************************************************************/
InsertEngine.demo = function () {

  return InsertEngine.createSampleMeeting();

};


/**********************************************************************
 * Complete Functional Test
 **********************************************************************/
function insertEngineFunctionalTest() {

  var mom = InsertEngine.demo();

  var result = InsertEngine.run(mom);

  Logger.log("========================================");
  Logger.log("FUNCTIONAL TEST PASSED");
  Logger.log("Meeting Code : " + result.meetingCode);
  Logger.log("========================================");

}


/**********************************************************************
 * Complete Health Check
 **********************************************************************/
function insertEngineHealthCheck() {

  Logger.log("========================================");
  Logger.log("Legend MOM Management System");
  Logger.log("InsertEngine Version 3.0");
  Logger.log("========================================");

  var mom = MOMBuilder.create();

  mom.date = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "dd/MM/yyyy"
  );

  mom.startTime = "07:00";

  mom.endTime = "07:20";

  mom.meetingCode = MeetingCodeEngine.generate();

  mom.meetingType = CONFIG.DEFAULT_MEETING_TYPE;

  mom.location = CONFIG.DEFAULT_LOCATION;

  mom.chairedBy = "Health Check";

  mom.agenda = "Health Check Meeting";

  MOMBuilder.addParticipant(
      mom,
      "User A"
  );

  MOMBuilder.addParticipant(
      mom,
      "User B"
  );

  MOMBuilder.addDiscussion(
      mom,
      "Safety"
  );

  MOMBuilder.addDiscussion(
      mom,
      "Production"
  );

  MOMBuilder.addDiscussion(
      mom,
      "Quality"
  );

  var result = InsertEngine.run(mom);

  Logger.log("Meeting Code : " + result.meetingCode);
  Logger.log("Start Row    : " + result.startRow);
  Logger.log("End Row      : " + result.endRow);
  Logger.log("Rows         : " + result.totalRows);

  Logger.log("========================================");
  Logger.log("InsertEngine Health Check PASSED");
  Logger.log("========================================");

}


/**********************************************************************
 * Version Information
 **********************************************************************/
InsertEngine.version = function () {

  return {

    module: "InsertEngine",

    version: "3.0 Final",

    status: "Production",

    author: "Legend MOM Management System"

  };

};


/**********************************************************************
 * Module Information
 **********************************************************************/
function insertEngineInfo() {

  Logger.log(

    JSON.stringify(

      InsertEngine.version(),

      null,

      2

    )

  );

}