/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : ConfigService.gs
 * Version : 3.0
 * Purpose : Read / Write System_Config
 **********************************************************************/

var ConfigService = {};


/**
 * Returns System_Config sheet
 */
ConfigService.getSheet = function () {

  var sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("System_Config");

  if (!sheet) {
    throw new Error("System_Config sheet not found.");
  }

  return sheet;

};


/**
 * Returns configuration value
 */
ConfigService.get = function (key, defaultValue) {

  var sheet = ConfigService.getSheet();

  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {

    if (String(values[i][0]).trim() == key) {

      return values[i][1];

    }

  }

  return defaultValue;

};


/**
 * Updates existing key or creates new one
 */
ConfigService.set = function (key, value) {

  var lock = LockService.getDocumentLock();

  lock.waitLock(30000);

  try {

    var sheet = ConfigService.getSheet();

    var values = sheet.getDataRange().getValues();

    for (var i = 1; i < values.length; i++) {

      if (String(values[i][0]).trim() == key) {

        sheet.getRange(i + 1, 2).setValue(value);

        Logger.log("Config Updated : " + key);

        return;

      }

    }

    sheet.appendRow([key, value]);

    Logger.log("Config Added : " + key);

  } finally {

    lock.releaseLock();

  }

};


/**
 * Returns TRUE/FALSE
 */
ConfigService.getBoolean = function (key, defaultValue) {

  var value = ConfigService.get(key, defaultValue);

  return String(value).toUpperCase() == "TRUE";

};


/**
 * Returns Number
 */
ConfigService.getNumber = function (key, defaultValue) {

  return Number(ConfigService.get(key, defaultValue));

};


/**
 * Increment numeric value
 */
ConfigService.increment = function (key) {

  var value = ConfigService.getNumber(key, 0);

  value++;

  ConfigService.set(key, value);

  return value;

};


/**
 * Check if key exists
 */
ConfigService.exists = function (key) {

  var sheet = ConfigService.getSheet();

  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {

    if (String(values[i][0]).trim() == key) {

      return true;

    }

  }

  return false;

};


/**
 * Returns all config as object
 */
ConfigService.getAll = function () {

  var obj = {};

  var sheet = ConfigService.getSheet();

  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {

    obj[values[i][0]] = values[i][1];

  }

  return obj;

};


/**
 * Health Check
 */
function configServiceHealthCheck() {

  Logger.log("===== Config Service =====");

  Logger.log("APP_NAME : " +
    ConfigService.get("APP_NAME", ""));

  Logger.log("VERSION : " +
    ConfigService.get("VERSION", ""));

  Logger.log("LAST_SEQUENCE : " +
    ConfigService.get("LAST_SEQUENCE", ""));

  Logger.log("Health Check Passed");

}