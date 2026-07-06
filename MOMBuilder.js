/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : MOMBuilder.gs
 * Version : 1.0
 * Purpose : MOM Object Builder
 **********************************************************************/

var MOMBuilder = {};


/**
 * Creates a new MOM object
 */
MOMBuilder.create = function () {

  return {

    date: "",

    startTime: "",

    endTime: "",

    meetingCode: "",

    meetingType: CONFIG.DEFAULT_MEETING_TYPE,

    location: CONFIG.DEFAULT_LOCATION,

    chairedBy: "",

    participants: [],

    agenda: "",

    discussion: [],

    recordStatus: CONFIG.DEFAULT_RECORD_STATUS

  };

};


/**
 * Adds participant
 */
MOMBuilder.addParticipant = function (mom, participant) {

  if (!participant) {
    return;
  }

  mom.participants.push(String(participant).trim());

};


/**
 * Adds discussion point
 */
MOMBuilder.addDiscussion = function (mom, point) {

  if (!point) {
    return;
  }

  mom.discussion.push(String(point).trim());

};


/**
 * Returns formatted participants text
 */
MOMBuilder.getParticipantsText = function (mom) {

  var text = "";

  for (var i = 0; i < mom.participants.length; i++) {

    if (i > 0) {
      text += "\n";
    }

    text += "- " + mom.participants[i];

  }

  return text;

};


/**
 * Returns discussion count
 */
MOMBuilder.getDiscussionCount = function (mom) {

  return mom.discussion.length;

};


/**
 * Basic validation
 */
MOMBuilder.isValid = function (mom) {

  if (!mom.date) return false;

  if (!mom.startTime) return false;

  if (!mom.endTime) return false;

  if (!mom.chairedBy) return false;

  if (mom.participants.length === 0) return false;

  if (!mom.agenda) return false;

  if (mom.discussion.length === 0) return false;

  return true;

};


/**
 * Health Check
 */
function momBuilderHealthCheck() {

  var mom = MOMBuilder.create();

  MOMBuilder.addParticipant(mom, "Sunil");
  MOMBuilder.addParticipant(mom, "Manish");

  MOMBuilder.addDiscussion(mom, "Safety");
  MOMBuilder.addDiscussion(mom, "Production");

  Logger.log("===== MOM Builder =====");

  Logger.log(
    MOMBuilder.getParticipantsText(mom)
  );

  Logger.log(
    "Discussion Count : " +
    MOMBuilder.getDiscussionCount(mom)
  );

  Logger.log("Health Check Passed");

}