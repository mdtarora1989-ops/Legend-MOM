/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Version : 2.0 Professional
 * Module  : Constants.gs
 * Purpose : Global Constants
 **********************************************************************/

const APP_CONSTANTS = Object.freeze({

  //==========================================================
  // RECORD STATUS
  //==========================================================

  RECORD_STATUS: Object.freeze({

    AVAILABLE: "Available",

    NOT_AVAILABLE: "Not Available"

  }),

  //==========================================================
  // DEFAULTS
  //==========================================================

  DEFAULTS: Object.freeze({

    LOCATION: "Departmental Area",

    MEETING_TYPE: "Morning Meeting",

    RECORD_STATUS: "Available"

  }),

  //==========================================================
  // MEETING TYPES
  //==========================================================

  MEETING_TYPES: Object.freeze([

    "Morning Meeting",

    "Production Meeting",

    "Quality Meeting",

    "Safety Meeting",

    "Maintenance Meeting",

    "Planning Meeting",

    "Training",

    "Management Review Meeting",

    "Operation Excellence",

    "Kaizen Review",

    "Customer Meeting",

    "Vendor Meeting",

    "HR Meeting",

    "Audit Meeting",

    "Other"

  ]),

  //==========================================================
  // LOCATIONS
  //==========================================================

  LOCATIONS: Object.freeze([

    "Departmental Area",

    "Conference Room",

    "Training Room",

    "Extrusion",

    "Bonding",

    "Maintenance",

    "Warehouse",

    "Dispatch",

    "Office",

    "Customer Site"

  ]),

  //==========================================================
  // UI COLORS
  //==========================================================

  COLORS: Object.freeze({

    SUCCESS: "#d9ead3",

    WARNING: "#fff2cc",

    ERROR: "#f4cccc",

    INFO: "#d0e0e3"

  }),

  //==========================================================
  // MERGEABLE COLUMNS
  //==========================================================

  MERGE_COLUMNS: Object.freeze([

    "PARTICIPANTS",

    "AGENDA"

  ]),

  //==========================================================
  // VALIDATION LIMITS
  //==========================================================

  LIMITS: Object.freeze({

    MAX_PARTICIPANTS: 100,

    MAX_DISCUSSION_POINTS: 500

  }),

  //==========================================================
  // LOG LEVELS
  //==========================================================

  LOG_LEVEL: Object.freeze({

    INFO: "INFO",

    WARNING: "WARNING",

    ERROR: "ERROR",

    DEBUG: "DEBUG"

  })

});


/**********************************************************************
 * Returns Meeting Types
 **********************************************************************/
function getMeetingTypes() {

  return APP_CONSTANTS.MEETING_TYPES.slice();

}


/**********************************************************************
 * Returns Locations
 **********************************************************************/
function getLocations() {

  return APP_CONSTANTS.LOCATIONS.slice();

}


/**********************************************************************
 * Returns Record Status List
 **********************************************************************/
function getRecordStatusList() {

  return [

    APP_CONSTANTS.RECORD_STATUS.AVAILABLE,

    APP_CONSTANTS.RECORD_STATUS.NOT_AVAILABLE

  ];

}


/**********************************************************************
 * Returns Default Values
 **********************************************************************/
function getDefaults() {

  return APP_CONSTANTS.DEFAULTS;

}


/**********************************************************************
 * Returns UI Color
 **********************************************************************/
function getUIColor(name) {

  if (!(name in APP_CONSTANTS.COLORS)) {

    throw new Error("Unknown UI color : " + name);

  }

  return APP_CONSTANTS.COLORS[name];

}


/**********************************************************************
 * Health Check
 **********************************************************************/
function constantsHealthCheck() {

  Logger.log("========== CONSTANTS ==========");

  Logger.log("Meeting Types : " +
    APP_CONSTANTS.MEETING_TYPES.length);

  Logger.log("Locations : " +
    APP_CONSTANTS.LOCATIONS.length);

  Logger.log("Merge Columns : " +
    APP_CONSTANTS.MERGE_COLUMNS.join(", "));

  Logger.log("Record Status : " +
    APP_CONSTANTS.RECORD_STATUS.AVAILABLE);

  Logger.log("Constants Health Check Passed");

}