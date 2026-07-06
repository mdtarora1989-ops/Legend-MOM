/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Version : 2.0 Professional
 * Module  : Bootstrap.gs
 * Purpose : Initial Application Setup
 **********************************************************************/

const SYSTEM_SHEET_NAME = "System_Config";

/**
 * Runs automatically when spreadsheet opens
 */
function onOpen() {

  SpreadsheetApp.getUi()
    .createMenu(CONFIG.MENU_NAME)
    .addItem("🚀 Initialize System", "initializeLegendMOM")
    .addSeparator()
    .addItem("➕ New MOM", "comingSoon")
    .addItem("🔍 Search MOM", "comingSoon")
    .addSeparator()
    .addItem("ℹ About", "showAbout")
    .addToUi();

}


/**
 * First time initialization
 */
function initializeLegendMOM() {

  const lock = LockService.getDocumentLock();

  lock.waitLock(30000);

  try {

    createSystemConfigSheet();

    APP_LOGGER.info("System initialized successfully.");

    SpreadsheetApp.getUi().alert(
      "Legend MOM Management System initialized successfully."
    );

  } catch (err) {

    logException(err);

    SpreadsheetApp.getUi().alert(err.message);

  } finally {

    lock.releaseLock();

  }

}


/**
 * Creates hidden System_Config sheet
 */
function createSystemConfigSheet() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let sheet = ss.getSheetByName(SYSTEM_SHEET_NAME);

  if (sheet) {

    APP_LOGGER.info("System_Config already exists.");

    return;

  }

  sheet = ss.insertSheet(SYSTEM_SHEET_NAME);

  sheet.hideSheet();

  const data = [

    ["KEY", "VALUE"],

    ["APP_NAME", CONFIG.APP_NAME],

    ["VERSION", CONFIG.VERSION],

    ["COMPANY", CONFIG.COMPANY],

    ["MEETING_PREFIX", CONFIG.MEETING_PREFIX],

    ["DEFAULT_RECORD_STATUS", CONFIG.DEFAULT_RECORD_STATUS],

    ["DEFAULT_LOCATION", CONFIG.DEFAULT_LOCATION],

    ["DEFAULT_MEETING_TYPE", CONFIG.DEFAULT_MEETING_TYPE],

    ["LAST_UPDATED", new Date()]

  ];

  sheet.getRange(1,1,data.length,data[0].length).setValues(data);

  sheet.getRange("A1:B1")
       .setFontWeight("bold");

  sheet.autoResizeColumns(1,2);

  APP_LOGGER.info("System_Config created.");

}


/**
 * Returns value from System_Config
 */
function getSystemValue(key){

  const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SYSTEM_SHEET_NAME);

  if(!sheet){

    throw new Error("System_Config not found.");

  }

  const values = sheet.getDataRange().getValues();

  for(let i=1;i<values.length;i++){

    if(values[i][0]===key){

      return values[i][1];

    }

  }

  return null;

}


/**
 * Updates System_Config value
 */
function setSystemValue(key,value){

  const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SYSTEM_SHEET_NAME);

  if(!sheet){

    throw new Error("System_Config not found.");

  }

  const values = sheet.getDataRange().getValues();

  for(let i=1;i<values.length;i++){

    if(values[i][0]===key){

      sheet.getRange(i+1,2).setValue(value);

      APP_LOGGER.info("Updated config : " + key);

      return;

    }

  }

  sheet.appendRow([key,value]);

  APP_LOGGER.info("Added config : " + key);

}


/**
 * About Dialog
 */
function showAbout(){

  SpreadsheetApp.getUi().alert(

    CONFIG.APP_NAME +

    "\n\nVersion : " +

    CONFIG.VERSION +

    "\n\nCompany : " +

    CONFIG.COMPANY

  );

}


/**
 * Placeholder
 */
function comingSoon(){

  SpreadsheetApp.getUi().alert(

    "Module under development."

  );

}