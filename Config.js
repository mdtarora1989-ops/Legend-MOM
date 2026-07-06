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
  // (Must exactly match Google Sheet)
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

    throw new Error(
      "Sheet not found : " + CONFIG.SHEET_NAME
    );

  }

  return sheet;

}


/**********************************************************************
 * Reads header row
 **********************************************************************/
function getHeaderRow() {

  const sheet = getMomSheet();

  const lastColumn = sheet.getLastColumn();

  return sheet
    .getRange(CONFIG.HEADER_ROW, 1, 1, lastColumn)
    .getValues()[0];

}


/**********************************************************************
 * Builds dynamic column map
 *
 * Example
 * {
 *   DATE : 2,
 *   START_TIME : 3
 * }
 **********************************************************************/
function getColumnMap() {

  const headers = getHeaderRow();

  const map = {};

  Object.keys(CONFIG.HEADERS).forEach(function(key){

    const headerName = CONFIG.HEADERS[key];

    const index = headers.indexOf(headerName);

    if(index === -1){

      throw new Error(
        "Required column not found : " + headerName
      );

    }

    map[key] = index + 1;

  });

  return map;

}


/**********************************************************************
 * Returns column number
 *
 * Example:
 * getColumn("DATE")
 *
 **********************************************************************/
function getColumn(name){

  const map = getColumnMap();

  if(!(name in map)){

    throw new Error(
      "Unknown column : " + name
    );

  }

  return map[name];

}


/**********************************************************************
 * Returns application information
 **********************************************************************/
function getAppInfo(){

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