/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : AIMapper.js
 * Version : 1.0
 * Purpose : Convert AI JSON into MOM Object
 **********************************************************************/

var AIMapper = {};

/**
 * Converts AI JSON into MOM Object
 */
AIMapper.mapToMOM = function (ai) {
  var mom = MOMBuilder.create();

  // ---------- Header ----------

  mom.date = ai.meetingDate || "";

  mom.startTime = ai.startTime || "";

  mom.endTime = ai.endTime || "";

  mom.meetingCode = MeetingCodeEngine.generate();

  mom.meetingType = CONFIG.DEFAULT_MEETING_TYPE;

  mom.location = ai.location || CONFIG.DEFAULT_LOCATION;

  mom.chairedBy = ai.chairedBy || "";

  mom.agenda = ai.agenda || "";

  mom.recordStatus = CONFIG.DEFAULT_RECORD_STATUS;

  // ---------- Participants ----------

  if (Array.isArray(ai.participants)) {
    ai.participants.forEach(function (person) {
      MOMBuilder.addParticipant(mom, person);
    });
  }

  // ---------- Discussion ----------

  if (Array.isArray(ai.discussion)) {
    ai.discussion.forEach(function (item) {
      var text = "";

      if (typeof item === "string") {
        text = item;
      } else {
        text = item.details || item.topic || "";
      }

      MOMBuilder.addDiscussion(mom, text);
    });
  }

  return mom;
};

/**
 * Validates and Inserts
 */
AIMapper.insert = function (ai) {
  var mom = AIMapper.mapToMOM(ai);

  ValidationEngine.validateOrThrow(mom);

  return InsertEngine.run(mom);
};

/**
 * Health Check
 */
function aiMapperHealthCheck() {
  var sample = {
    meetingDate: "06/07/2026",

    startTime: "07:00",

    endTime: "07:20",

    chairedBy: "Mudit Arora",

    agenda: "Morning Production Meeting",

    participants: ["Rajesh", "Lohansh Sehgal"],

    discussion: [
      {
        topic: "Production",

        details: "Increase extrusion output",
      },

      {
        topic: "Safety",

        details: "Check fire extinguishers",
      },
    ],
  };

  var mom = AIMapper.mapToMOM(sample);

  Logger.log(JSON.stringify(mom, null, 2));
}
