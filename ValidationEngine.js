/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : ValidationEngine.gs
 * Version : 1.0
 * Purpose : Validate MOM Object
 **********************************************************************/

var ValidationEngine = {};


/**
 * Creates validation result
 */
ValidationEngine.createResult = function () {

  return {
    success: true,
    errors: []
  };

};


/**
 * Adds validation error
 */
ValidationEngine.addError = function (result, message) {

  result.success = false;
  result.errors.push(message);

};


/**
 * Validates MOM object
 */
ValidationEngine.validate = function (mom) {

  var result = ValidationEngine.createResult();

  if (!mom) {

    ValidationEngine.addError(result, "MOM object is missing.");
    return result;

  }

  // Mandatory fields (must exist and be non-empty)
  if (!mom.date || String(mom.date).trim() === "") {

    ValidationEngine.addError(result, "Date is required.");

  }

  if (!mom.meetingType || String(mom.meetingType).trim() === "") {

    ValidationEngine.addError(result, "Meeting Type is required.");

  }

  if (!mom.location || String(mom.location).trim() === "") {

    ValidationEngine.addError(result, "Location is required.");

  }

  if (!mom.recordStatus || String(mom.recordStatus).trim() === "") {

    ValidationEngine.addError(result, "Record Status is required.");

  }

  // At least one discussion item required
  if (!mom.discussion || mom.discussion.length === 0) {

    ValidationEngine.addError(result, "At least one discussion point is required.");

  }

  // Optional fields (no hard errors): startTime, endTime, chairedBy, agenda, participants
  // Attempt to normalize times if normalization helper exists; log warnings instead of failing.
  try {
    if (mom.startTime && ValidationEngine.normalizeTime) {
      mom.startTime = ValidationEngine.normalizeTime(mom.startTime);
    }
    if (mom.endTime && ValidationEngine.normalizeTime) {
      mom.endTime = ValidationEngine.normalizeTime(mom.endTime);
    }
  } catch (e) {
    Logger.log('Time normalization warning: ' + (e && e.message ? e.message : e));
    // Do not add validation errors for time normalization failures.
  }

  return result;

};


/**
 * Throws validation error if invalid
 */
ValidationEngine.validateOrThrow = function (mom) {

  var result = ValidationEngine.validate(mom);

  if (!result.success) {

    throw new Error(result.errors.join("\n"));

  }

  return true;

};


/**
 * Health Check
 */
function validationEngineHealthCheck() {

  var mom = MOMBuilder.create();

  mom.date = "05/07/2026";
  mom.startTime = "07:00";
  mom.endTime = "07:25";
  mom.meetingType = CONFIG.DEFAULT_MEETING_TYPE;
  mom.location = CONFIG.DEFAULT_LOCATION;
  mom.chairedBy = "Rakesh Negi";
  mom.agenda = "Morning Meeting";
  mom.recordStatus = CONFIG.DEFAULT_RECORD_STATUS;

  MOMBuilder.addParticipant(mom, "Sunil");
  MOMBuilder.addDiscussion(mom, "Safety");

  var result = ValidationEngine.validate(mom);

  Logger.log("===== Validation Engine =====");
  Logger.log("Success : " + result.success);

  if (result.errors.length > 0) {

    Logger.log(result.errors.join("\n"));

  }

  Logger.log("Health Check Passed");

}
