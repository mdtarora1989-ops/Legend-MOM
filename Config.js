/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Version : 2.0 Professional
 * Module  : Config.gs
 * Purpose : Global Configuration
 **********************************************************************/

const CONFIG = Object.freeze({

  //==============================================================
  // APPLICATION
  //==============================================================

  APP_NAME: "Legend MOM Management System",

  VERSION: "2.0",

  COMPANY: "Legend Polyfoams Pvt. Ltd.",

  SHEET_NAME: "Meeting Scheduled (2026-2027)",

  HEADER_ROW: 1,

  FIRST_DATA_ROW: 2,

  //==============================================================
  // MENU
  //==============================================================

  MENU_NAME: "Legend MOM",

  MENU_NEW: "➕ New MOM",

  MENU_SEARCH: "🔍 Search MOM",

  MENU_SETTINGS: "⚙ Settings",

  MENU_ABOUT: "ℹ About",

  //==============================================================
  // DEFAULT VALUES
  //==============================================================

  DEFAULT_RECORD_STATUS: "Available",

  DEFAULT_LOCATION: "Departmental Area",

  DEFAULT_MEETING_TYPE: "Morning Meeting",

  MEETING_PREFIX: "LM",

  //==============================================================
  // SHEET HEADERS
  // (Use the actual long header strings if desired)
  //==============================================================
  HEADERS: Object.freeze({

    SERIAL: "S.No.",

    DATE: "Date",

    START_TIME: "Start Time",

    END_TIME: "End time",

    MEETING_CODE: "Meeting Code",

    MEETING_TYPE: "Meeting Type",

    LOCATION: "Location",

    CHAIRED_BY: "Chaired By",

    PARTICIPANTS: "Participants",

    AGENDA: "Agenda",

    DISCUSSION: "Key Discussion",

    RECORD: "Record Document availabe or not"

  })

});

/**********************************************************************
 * Returns active spreadsheet
 **********************************************************************/
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**********************************************************************
 * Returns MOM sheet
 **********************************************************************/
function getMomSheet() {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    throw new Error("Sheet not found : " + CONFIG.SHEET_NAME);
  }
  return sheet;
}

/**********************************************************************
 * Reads header row
 **********************************************************************/
function getHeaderRow() {
  const sheet = getMomSheet();
  const lastColumn = sheet.getLastColumn();
  // Read the header row across the current lastColumn
  return sheet
    .getRange(CONFIG.HEADER_ROW, 1, 1, lastColumn)
    .getValues()[0];
}

/**********************************************************************
 * Header normalization helper
 **********************************************************************/
function normalizeHeaderText(s) {
  return String(s || "")
    .replace(/\u00A0/g, " ") // NBSP -> space
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
    .toLowerCase();
}

/**********************************************************************
 * Builds dynamic column map — tolerant matching
 *
 * Returns a map of CONFIG header keys to 1-based column numbers:
 * {
 *   DATE: 2,
 *   START_TIME: 3
 * }
 **********************************************************************/
function getColumnMap() {
  const headers = getHeaderRow();
  const map = {};
  // Normalize the sheet headers
  const normalizedHeaders = headers.map(h => normalizeHeaderText(h));

  // Build reverse lookup: normalized header -> index (1-based)
  const headerIndex = {};
  for (let i = 0; i < normalizedHeaders.length; i++) {
    headerIndex[normalizedHeaders[i]] = i + 1;
  }

  const notFound = [];

  Object.keys(CONFIG.HEADERS).forEach(function (key) {
    const expected = CONFIG.HEADERS[key];
    const normExpected = normalizeHeaderText(expected);

    // Exact normalized match
    if (normExpected in headerIndex) {
      map[key] = headerIndex[normExpected];
      return;
    }

    // Soft-match: all words of expected appear in a sheet header
    const expectedWords = normExpected.split(" ").filter(Boolean);
    let foundIndex = -1;
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const h = normalizedHeaders[i];
      let allPresent = true;
      for (let j = 0; j < expectedWords.length; j++) {
        if (h.indexOf(expectedWords[j]) === -1) {
          allPresent = false;
          break;
        }
      }
      if (allPresent) {
        foundIndex = i + 1;
        break;
      }
    }

    if (foundIndex !== -1) {
      map[key] = foundIndex;
      Logger.log("Warning: loosely matched header '" + expected + "' to sheet header '" + headers[foundIndex - 1] + "'");
      return;
    }

    notFound.push({ key: key, expected: expected });
  });

  if (notFound.length > 0) {
    // Helpful error message showing what's missing and what sheet headers are
    let msg = "Some required columns not found in sheet header row:\n";
    notFound.forEach(function (it) {
      msg += "- " + it.key + " expected header: '" + it.expected + "'\n";
    });
    msg += "\nSheet headers found:\n";
    headers.forEach(function (h, i) {
      msg += (i + 1) + ": '" + String(h) + "'\n";
    });
    throw new Error(msg);
  }

  return map;
}

/**********************************************************************
 * Returns column number
 **********************************************************************/
function getColumn(name) {
  const map = getColumnMap();
  if (!(name in map)) {
    throw new Error("Unknown column : " + name);
  }
  return map[name];
}

/**********************************************************************
 * Returns application information
 **********************************************************************/
function getAppInfo() {
  return {
    app: CONFIG.APP_NAME,
    version: CONFIG.VERSION,
    company: CONFIG.COMPANY,
    sheet: CONFIG.SHEET_NAME
  };
}

/**********************************************************************
 * Health Check
 **********************************************************************/
function configHealthCheck(){
  const info = getAppInfo();
  Logger.log("======================================");
  Logger.log(info.app);
  Logger.log("Version : " + info.version);
  Logger.log("Company : " + info.company);
  Logger.log("Sheet : " + info.sheet);
  Logger.log("======================================");

  const map = getColumnMap();
  Object.keys(map).forEach(function(key){
    Logger.log(key + " = Column " + map[key]);
  });

  Logger.log("CONFIG HEALTH CHECK PASSED");
}
