/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Version : 2.0 Professional
 * Module  : Logger.gs
 * Purpose : Centralized Logging Framework
 **********************************************************************/

const APP_LOGGER = (() => {

  const PREFIX = "[Legend MOM]";

  /**
   * Returns formatted timestamp
   */
  function getTimestamp() {
    return Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm:ss"
    );
  }

  /**
   * Generic writer
   */
  function write(level, message) {

    const text =
      PREFIX +
      " [" + level + "] " +
      "[" + getTimestamp() + "] " +
      message;

    Logger.log(text);

  }

  return {

    info(message) {

      write(APP_CONSTANTS.LOG_LEVEL.INFO, message);

    },

    warning(message) {

      write(APP_CONSTANTS.LOG_LEVEL.WARNING, message);

    },

    error(message) {

      write(APP_CONSTANTS.LOG_LEVEL.ERROR, message);

    },

    debug(message) {

      write(APP_CONSTANTS.LOG_LEVEL.DEBUG, message);

    }

  };

})();



/**********************************************************************
 * Logs Application Startup
 **********************************************************************/
function logApplicationStart() {

  APP_LOGGER.info(
    CONFIG.APP_NAME +
    " v" +
    CONFIG.VERSION +
    " Started."
  );

}



/**********************************************************************
 * Logs Validation Result
 **********************************************************************/
function logValidation(success, errors) {

  if (success) {

    APP_LOGGER.info("Validation Passed.");

    return;

  }

  APP_LOGGER.warning(
    "Validation Failed : " +
    errors.join(" | ")
  );

}



/**********************************************************************
 * Logs Meeting Code
 **********************************************************************/
function logMeetingCode(code) {

  APP_LOGGER.info(
    "Meeting Code : " + code
  );

}



/**********************************************************************
 * Logs Insert Operation
 **********************************************************************/
function logInsert(row, discussionCount) {

  APP_LOGGER.info(

    "Inserted at Row : " +

    row +

    " | Discussion Rows : " +

    discussionCount

  );

}



/**********************************************************************
 * Logs Merge Operation
 **********************************************************************/
function logMerge(startRow, endRow) {

  APP_LOGGER.info(

    "Merged Participants & Agenda : " +

    startRow +

    " - " +

    endRow

  );

}



/**********************************************************************
 * Logs Exception
 **********************************************************************/
function logException(error) {

  if (error instanceof Error) {

    APP_LOGGER.error(

      error.message +

      "\n" +

      error.stack

    );

    return;

  }

  APP_LOGGER.error(String(error));

}



/**********************************************************************
 * Health Check
 **********************************************************************/
function loggerHealthCheck() {

  APP_LOGGER.info("Logger Ready");

  APP_LOGGER.warning("Warning Test");

  APP_LOGGER.debug("Debug Test");

  APP_LOGGER.error("Error Test");

}
function testVSCode() {
  Logger.log("VS Code Connected Successfully");
}