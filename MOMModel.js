/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : MOMModel.gs
 * Version : 2.0 (Harmonized)
 * Purpose : MOM Domain Model (aligned with CONFIG and MOMBuilder)
 **********************************************************************/

function createMOM() {
  return {
    date: null,
    startTime: "",
    endTime: "",
    meetingCode: "",
    meetingType: CONFIG.DEFAULT_MEETING_TYPE,
    location: CONFIG.DEFAULT_LOCATION,
    chairedBy: "",
    participants: [],
    agenda: "",
    discussion: [],
    recordStatus: CONFIG.DEFAULT_RECORD_STATUS,
  };
}

function cloneMOM(mom) {
  return JSON.parse(JSON.stringify(mom));
}

function addParticipant(mom, name) {
  if (!name) return;
  name = String(name).trim();
  if (name === "") return;
  if (mom.participants.indexOf(name) === -1) {
    mom.participants.push(name);
  }
}

function addDiscussion(mom, text) {
  if (!text) return;
  text = String(text).trim();
  if (text === "") return;
  mom.discussion.push(text);
}

function setParticipantsFromText(mom, text) {
  mom.participants = [];
  if (!text) return;
  String(text)
    .split(/\r?\n/)
    .forEach(function (item) {
      item = item.replace(/^-/, "").trim();
      if (item) addParticipant(mom, item);
    });
}

function setDiscussionFromText(mom, text) {
  mom.discussion = [];
  if (!text) return;
  String(text)
    .split(/\r?\n/)
    .forEach(function (item) {
      item = item.trim();
      if (item) addDiscussion(mom, item);
    });
}

function getParticipantsText(mom) {
  return mom.participants
    .map(function (name) {
      return "- " + name;
    })
    .join("\n");
}

function getDiscussionCount(mom) {
  return mom.discussion.length;
}

function getParticipantCount(mom) {
  return mom.participants.length;
}

function toObject(mom) {
  return {
    date: mom.date,
    startTime: mom.startTime,
    endTime: mom.endTime,
    meetingCode: mom.meetingCode,
    meetingType: mom.meetingType,
    location: mom.location,
    chairedBy: mom.chairedBy,
    participants: cloneMOM(mom.participants),
    agenda: mom.agenda,
    discussion: cloneMOM(mom.discussion),
    recordStatus: mom.recordStatus,
  };
}

function createResponse(success, message, data) {
  return {
    success: success,
    message: message || "",
    data: data || null,
    timestamp: new Date(),
  };
}

function momModelHealthCheck() {
  var mom = createMOM();
  mom.date = "03/07/2026";
  mom.startTime = "07:00";
  mom.endTime = "07:25";
  mom.meetingCode = "LM/2627/0208";
  mom.chairedBy = "Rakesh Negi";
  mom.agenda = "Morning Meeting";
  addParticipant(mom, "Sunil");
  addParticipant(mom, "Mohit");
  addParticipant(mom, "Kapil");
  addDiscussion(mom, "Safety - No accident yesterday");
  addDiscussion(mom, "Production plan reviewed");
  Logger.log(JSON.stringify(toObject(mom), null, 2));
  Logger.log("Participants : " + getParticipantCount(mom));
  Logger.log("Discussion : " + getDiscussionCount(mom));
}
