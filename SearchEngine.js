/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : SearchEngine.gs
 * Version : 3.0 Final
 * Part    : 1 of 5
 * Purpose : Search Foundation
 **********************************************************************/

var SearchEngine = {};


/**********************************************************************
 * Returns MOM Sheet
 **********************************************************************/
SearchEngine.getSheet = function () {

  return SheetService.getSheet();

};


/**********************************************************************
 * Returns Column Number
 **********************************************************************/
SearchEngine.column = function (name) {

  return SheetService.column(name);

};


/**********************************************************************
 * Returns Last Row
 **********************************************************************/
SearchEngine.lastRow = function () {

  return SheetService.getLastRow();

};


/**********************************************************************
 * Returns Data Range
 **********************************************************************/
SearchEngine.getDataRange = function () {

  var sheet = SearchEngine.getSheet();

  var lastRow = sheet.getLastRow();

  var lastColumn = sheet.getLastColumn();

  if (lastRow < CONFIG.FIRST_DATA_ROW) {

    return null;

  }

  return sheet.getRange(

    CONFIG.FIRST_DATA_ROW,
    1,
    lastRow - CONFIG.FIRST_DATA_ROW + 1,
    lastColumn

  );

};


/**********************************************************************
 * Returns Complete Data
 **********************************************************************/
SearchEngine.getData = function () {

  var range = SearchEngine.getDataRange();

  if (range === null) {

    return [];

  }

  return range.getValues();

};


/**********************************************************************
 * Returns Empty Search Result
 **********************************************************************/
SearchEngine.emptyResult = function () {

  return {

    found: false,

    row: -1,

    meetingCode: "",

    startRow: -1,

    endRow: -1,

    rowCount: 0,

    data: []

  };

};


/**********************************************************************
 * Builds Search Result
 **********************************************************************/
SearchEngine.buildResult = function (meetingCode) {

  var block = SheetService.findMeetingBlock(meetingCode);

  if (!block.found) {

    return SearchEngine.emptyResult();

  }

  var sheet = SearchEngine.getSheet();

  var values = sheet.getRange(

      block.startRow,
      1,
      block.rowCount,
      sheet.getLastColumn()

  ).getValues();

  return {

    found: true,

    row: block.startRow,

    meetingCode: meetingCode,

    startRow: block.startRow,

    endRow: block.endRow,

    rowCount: block.rowCount,

    data: values

  };

};


/**********************************************************************
 * Search by Meeting Code
 **********************************************************************/
SearchEngine.searchByMeetingCode = function (meetingCode) {

  if (!meetingCode) {

    return SearchEngine.emptyResult();

  }

  return SearchEngine.buildResult(

      String(meetingCode).trim()

  );

};


/**********************************************************************
 * Meeting Exists
 **********************************************************************/
SearchEngine.exists = function (meetingCode) {

  return SearchEngine.searchByMeetingCode(

      meetingCode

  ).found;

};


/**********************************************************************
 * Part-1 Health Check
 **********************************************************************/
function searchEnginePart1HealthCheck() {

  Logger.log("================================");
  Logger.log("SearchEngine Part-1 Loaded");
  Logger.log("Rows : " + SearchEngine.lastRow());
  Logger.log("================================");

}
/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : SearchEngine.gs
 * Version : 3.0 Final
 * Part    : 2 of 5
 * Purpose : Date Search Engine
 **********************************************************************/


/**********************************************************************
 * Normalizes Date
 **********************************************************************/
SearchEngine.normalizeDate = function (value) {

  if (value === null || value === "") {

    return "";

  }

  if (Object.prototype.toString.call(value) === "[object Date]") {

    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "dd/MM/yyyy"
    );

  }

  return String(value).trim();

};


/**********************************************************************
 * Returns all rows for a date.
 **********************************************************************/
SearchEngine.searchByDate = function (date) {

  var searchDate = SearchEngine.normalizeDate(date);

  var data = SearchEngine.getData();

  var dateColumn = SearchEngine.column("DATE") - 1;

  var meetingColumn = SearchEngine.column("MEETING_CODE") - 1;

  var results = [];

  for (var i = 0; i < data.length; i++) {

    var rowDate = SearchEngine.normalizeDate(
      data[i][dateColumn]
    );

    if (rowDate !== searchDate) {
      continue;
    }

    var meetingCode = String(
      data[i][meetingColumn]
    ).trim();

    if (meetingCode === "") {
      continue;
    }

    results.push(
      SearchEngine.buildResult(meetingCode)
    );

  }

  return results;

};


/**********************************************************************
 * Returns all meetings between two dates.
 **********************************************************************/
SearchEngine.searchByDateRange = function (fromDate, toDate) {

  var from = new Date(fromDate);

  var to = new Date(toDate);

  var data = SearchEngine.getData();

  var dateColumn = SearchEngine.column("DATE") - 1;

  var meetingColumn = SearchEngine.column("MEETING_CODE") - 1;

  var results = [];

  for (var i = 0; i < data.length; i++) {

    if (String(data[i][meetingColumn]).trim() === "") {
      continue;
    }

    var current = new Date(data[i][dateColumn]);

    if (current >= from && current <= to) {

      results.push(

        SearchEngine.buildResult(

          String(data[i][meetingColumn]).trim()

        )

      );

    }

  }

  return results;

};


/**********************************************************************
 * Returns first matching meeting.
 **********************************************************************/
SearchEngine.searchFirst = function (meetingCode) {

  return SearchEngine.searchByMeetingCode(
    meetingCode
  );

};


/**********************************************************************
 * Returns every meeting in sheet.
 **********************************************************************/
SearchEngine.searchAll = function () {

  var data = SearchEngine.getData();

  var meetingColumn = SearchEngine.column("MEETING_CODE") - 1;

  var results = [];

  for (var i = 0; i < data.length; i++) {

    var meetingCode = String(
      data[i][meetingColumn]
    ).trim();

    if (meetingCode === "") {
      continue;
    }

    results.push(

      SearchEngine.buildResult(
        meetingCode
      )

    );

  }

  return results;

};


/**********************************************************************
 * Part-2 Health Check
 **********************************************************************/
function searchEnginePart2HealthCheck() {

  Logger.log("================================");

  Logger.log("SearchEngine Part-2");

  Logger.log(
    "Total Meetings : " +
    SearchEngine.searchAll().length
  );

  Logger.log("================================");

}
/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : SearchEngine.gs
 * Version : 3.0 Final
 * Part    : 3 of 5
 * Purpose : Field Search Engine
 **********************************************************************/


/**********************************************************************
 * Returns TRUE if value contains keyword.
 **********************************************************************/
SearchEngine.contains = function (value, keyword) {

  value = String(value || "").toLowerCase().trim();

  keyword = String(keyword || "").toLowerCase().trim();

  return value.indexOf(keyword) > -1;

};


/**********************************************************************
 * Generic Column Search
 **********************************************************************/
SearchEngine.searchByColumn = function (columnName, keyword) {

  if (!keyword) {

    return [];

  }

  var data = SearchEngine.getData();

  var searchColumn = SearchEngine.column(columnName) - 1;

  var meetingColumn = SearchEngine.column("MEETING_CODE") - 1;

  var results = [];

  var added = {};

  for (var i = 0; i < data.length; i++) {

    if (

      !SearchEngine.contains(

        data[i][searchColumn],

        keyword

      )

    ) {

      continue;

    }

    var meetingCode = String(

      data[i][meetingColumn]

    ).trim();

    if (meetingCode === "") {

      continue;

    }

    if (added[meetingCode]) {

      continue;

    }

    added[meetingCode] = true;

    results.push(

      SearchEngine.buildResult(

        meetingCode

      )

    );

  }

  return results;

};


/**********************************************************************
 * Search By Participant
 **********************************************************************/
SearchEngine.searchByParticipant = function (participant) {

  return SearchEngine.searchByColumn(

    "PARTICIPANTS",

    participant

  );

};


/**********************************************************************
 * Search By Agenda
 **********************************************************************/
SearchEngine.searchByAgenda = function (agenda) {

  return SearchEngine.searchByColumn(

    "AGENDA",

    agenda

  );

};


/**********************************************************************
 * Search By Discussion
 **********************************************************************/
SearchEngine.searchByDiscussion = function (discussion) {

  return SearchEngine.searchByColumn(

    "DISCUSSION",

    discussion

  );

};


/**********************************************************************
 * Search By Chaired By
 **********************************************************************/
SearchEngine.searchByChair = function (chairName) {

  return SearchEngine.searchByColumn(

    "CHAIRED_BY",

    chairName

  );

};


/**********************************************************************
 * Search By Meeting Type
 **********************************************************************/
SearchEngine.searchByMeetingType = function (meetingType) {

  return SearchEngine.searchByColumn(

    "MEETING_TYPE",

    meetingType

  );

};


/**********************************************************************
 * Search By Record Status
 **********************************************************************/
SearchEngine.searchByRecordStatus = function (status) {

  return SearchEngine.searchByColumn(

    "RECORD",

    status

  );

};


/**********************************************************************
 * Part-3 Health Check
 **********************************************************************/
function searchEnginePart3HealthCheck() {

  Logger.log("================================");

  Logger.log("SearchEngine Part-3");

  Logger.log(

    "Participant Search Ready"

  );

  Logger.log(

    "Discussion Search Ready"

  );

  Logger.log(

    "Agenda Search Ready"

  );

  Logger.log("================================");

}
/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : SearchEngine.gs
 * Version : 3.0 Final
 * Part    : 4 of 5
 * Purpose : Advanced Search & Utilities
 **********************************************************************/


/**********************************************************************
 * Returns Meeting Object from Search Result
 **********************************************************************/
SearchEngine.getMeeting = function (meetingCode) {

  return SearchEngine.searchByMeetingCode(
    meetingCode
  );

};


/**********************************************************************
 * Generic Search
 *
 * Example
 * SearchEngine.search({
 *   meetingCode : "...",
 *   participant : "...",
 *   agenda : "...",
 *   discussion : "...",
 *   chairedBy : "...",
 *   meetingType : "...",
 *   recordStatus : "..."
 * });
 **********************************************************************/
SearchEngine.search = function (criteria) {

  if (!criteria) {

    return [];

  }

  if (criteria.meetingCode) {

    var meeting = SearchEngine.searchByMeetingCode(
      criteria.meetingCode
    );

    return meeting.found ? [meeting] : [];

  }

  if (criteria.participant) {

    return SearchEngine.searchByParticipant(
      criteria.participant
    );

  }

  if (criteria.agenda) {

    return SearchEngine.searchByAgenda(
      criteria.agenda
    );

  }

  if (criteria.discussion) {

    return SearchEngine.searchByDiscussion(
      criteria.discussion
    );

  }

  if (criteria.chairedBy) {

    return SearchEngine.searchByChair(
      criteria.chairedBy
    );

  }

  if (criteria.meetingType) {

    return SearchEngine.searchByMeetingType(
      criteria.meetingType
    );

  }

  if (criteria.recordStatus) {

    return SearchEngine.searchByRecordStatus(
      criteria.recordStatus
    );

  }

  if (criteria.date) {

    return SearchEngine.searchByDate(
      criteria.date
    );

  }

  if (criteria.fromDate && criteria.toDate) {

    return SearchEngine.searchByDateRange(
      criteria.fromDate,
      criteria.toDate
    );

  }

  return [];

};


/**********************************************************************
 * Returns Meeting Codes Only
 **********************************************************************/
SearchEngine.getMeetingCodes = function (results) {

  var codes = [];

  for (var i = 0; i < results.length; i++) {

    codes.push(

      results[i].meetingCode

    );

  }

  return codes;

};


/**********************************************************************
 * Returns Total Meetings
 **********************************************************************/
SearchEngine.count = function () {

  return SearchEngine.searchAll().length;

};


/**********************************************************************
 * Returns TRUE if Sheet has Meetings
 **********************************************************************/
SearchEngine.hasMeetings = function () {

  return SearchEngine.count() > 0;

};


/**********************************************************************
 * Returns Search Statistics
 **********************************************************************/
SearchEngine.statistics = function () {

  return {

    totalMeetings: SearchEngine.count(),

    sheetLastRow: SearchEngine.lastRow(),

    hasMeetings: SearchEngine.hasMeetings()

  };

};


/**********************************************************************
 * Part-4 Health Check
 **********************************************************************/
function searchEnginePart4HealthCheck() {

  var stats = SearchEngine.statistics();

  Logger.log("================================");
  Logger.log("SearchEngine Part-4");
  Logger.log("Meetings : " + stats.totalMeetings);
  Logger.log("Last Row : " + stats.sheetLastRow);
  Logger.log("Available : " + stats.hasMeetings);
  Logger.log("================================");

}
/**********************************************************************
 * Legend MOM Management System
 * --------------------------------------------------------------------
 * Module  : SearchEngine.gs
 * Version : 3.0 Final
 * Part    : 5 of 5
 * Purpose : Public API, Diagnostics & Health Check
 **********************************************************************/


/**********************************************************************
 * Returns SearchEngine Status
 **********************************************************************/
SearchEngine.isReady = function () {

  try {

    return SheetService.getSheet() !== null;

  } catch (e) {

    return false;

  }

};


/**********************************************************************
 * Public Search API
 **********************************************************************/
SearchEngine.run = function (criteria) {

  if (!SearchEngine.isReady()) {

    throw new Error(
      "SearchEngine is not ready."
    );

  }

  return SearchEngine.search(criteria);

};


/**********************************************************************
 * Returns first meeting or null
 **********************************************************************/
SearchEngine.first = function (criteria) {

  var results = SearchEngine.run(criteria);

  if (results.length === 0) {

    return null;

  }

  return results[0];

};


/**********************************************************************
 * Prints Search Results
 **********************************************************************/
SearchEngine.print = function (results) {

  Logger.log("========================================");
  Logger.log("Legend MOM Search Results");
  Logger.log("========================================");

  if (!results || results.length === 0) {

    Logger.log("No Records Found");

    Logger.log("========================================");

    return;

  }

  for (var i = 0; i < results.length; i++) {

    Logger.log("----------------------------------------");

    Logger.log("Meeting Code : " + results[i].meetingCode);

    Logger.log("Start Row    : " + results[i].startRow);

    Logger.log("End Row      : " + results[i].endRow);

    Logger.log("Rows         : " + results[i].rowCount);

  }

  Logger.log("========================================");

};


/**********************************************************************
 * Demo Search
 **********************************************************************/
function searchEngineDemo() {

  var meetings = SearchEngine.searchAll();

  SearchEngine.print(meetings);

}


/**********************************************************************
 * Functional Test
 **********************************************************************/
function searchEngineFunctionalTest() {

  Logger.log("========================================");

  Logger.log("SearchEngine Functional Test");

  Logger.log("----------------------------------------");

  var meetings = SearchEngine.searchAll();

  Logger.log("Meetings Found : " + meetings.length);

  if (meetings.length > 0) {

    Logger.log(
      "First Meeting : " +
      meetings[0].meetingCode
    );

  }

  Logger.log("========================================");

}


/**********************************************************************
 * Complete Health Check
 **********************************************************************/
function searchEngineHealthCheck() {

  Logger.log("========================================");

  Logger.log("Legend MOM Management System");

  Logger.log("SearchEngine Version 3.0");

  Logger.log("========================================");

  var stats = SearchEngine.statistics();

  Logger.log("Sheet Ready    : " + SearchEngine.isReady());

  Logger.log("Total Meetings : " + stats.totalMeetings);

  Logger.log("Last Row       : " + stats.sheetLastRow);

  Logger.log("Has Meetings   : " + stats.hasMeetings);

  Logger.log("========================================");

  Logger.log("SearchEngine Health Check PASSED");

  Logger.log("========================================");

}


/**********************************************************************
 * Version Information
 **********************************************************************/
SearchEngine.version = function () {

  return {

    module: "SearchEngine",

    version: "3.0 Final",

    status: "Production",

    author: "Legend MOM Management System"

  };

};


/**********************************************************************
 * Module Information
 **********************************************************************/
function searchEngineInfo() {

  Logger.log(

    JSON.stringify(

      SearchEngine.version(),

      null,

      2

    )

  );

}