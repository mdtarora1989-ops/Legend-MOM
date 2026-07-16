/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : ValidationEngine.gs
 * Version : 1.1 (Simplified - no targetDate/status)
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
 * NOTE: targetDate and status are removed from validation
 */
ValidationEngine.validate = function (mom) {

  var result = ValidationEngine.createResult();

  if (!mom) {

    ValidationEngine.addError(result, "MOM object is missing.");
    return result;

  }

  if (!mom.date || String(mom.date).trim() === "") {

    ValidationEngine.addError(result, "Date is required.");

  }

  if (!mom.startTime || String(mom.startTime).trim() === "") {

    ValidationEngine.addError(result, "Start Time is required.");

  }

  if (!mom.endTime || String(mom.endTime).trim() === "") {

    ValidationEngine.addError(result, "End Time is required.");

  }

  if (!mom.meetingType || String(mom.meetingType).trim() === "") {

    ValidationEngine.addError(result, "Meeting Type is required.");

  }

  if (!mom.location || String(mom.location).trim() === "") {

    ValidationEngine.addError(result, "Location is required.");

  }

  if (!mom.chairedBy || String(mom.chairedBy).trim() === "") {

    ValidationEngine.addError(result, "Chairperson is required.");

  }

  if (!mom.agenda || String(mom.agenda).trim() === "") {

    ValidationEngine.addError(result, "Agenda is required.");

  }

  if (!mom.recordStatus || String(mom.recordStatus).trim() === "") {

    ValidationEngine.addError(result, "Record Status is required.");

  }

  if (!mom.participants || mom.participants.length === 0) {

    ValidationEngine.addError(result, "At least one participant is required.");

  }

  if (!mom.discussion || mom.discussion.length === 0) {

    ValidationEngine.addError(result, "At least one discussion point is required.");

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