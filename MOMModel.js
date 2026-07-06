/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Version : 2.0 Professional
 * Module  : MOMModel.gs
 * Purpose : MOM Domain Model
 **********************************************************************/

/**
 * Creates a new empty MOM object.
 */
function createMOM() {

  return {

    date: null,

    startTime: "",

    endTime: "",

    meetingCode: "",

    meetingType: APP_CONSTANTS.DEFAULTS.MEETING_TYPE,

    location: APP_CONSTANTS.DEFAULTS.LOCATION,

    chairedBy: "",

    participants: [],

    agenda: "",

    discussions: [],

    recordStatus: APP_CONSTANTS.DEFAULTS.RECORD_STATUS

  };

}


/**
 * Deep clone MOM object
 */
function cloneMOM(mom){

  return JSON.parse(JSON.stringify(mom));

}


/**
 * Adds participant
 */
function addParticipant(mom,name){

  if(!name) return;

  name = String(name).trim();

  if(name==="") return;

  if(mom.participants.indexOf(name)===-1){

    mom.participants.push(name);

  }

}


/**
 * Adds discussion point
 */
function addDiscussion(mom,text){

  if(!text) return;

  text = String(text).trim();

  if(text==="") return;

  mom.discussions.push(text);

}


/**
 * Converts multiline participants into array
 */
function setParticipantsFromText(mom,text){

  mom.participants=[];

  if(!text) return;

  String(text)
    .split(/\r?\n/)
    .forEach(function(item){

      item=item.replace(/^-/, "").trim();

      if(item){

        addParticipant(mom,item);

      }

    });

}


/**
 * Converts multiline discussion into array
 */
function setDiscussionFromText(mom,text){

  mom.discussions=[];

  if(!text) return;

  String(text)
    .split(/\r?\n/)
    .forEach(function(item){

      item=item.trim();

      if(item){

        addDiscussion(mom,item);

      }

    });

}


/**
 * Returns participants in sheet format
 *
 * - Sunil
 * - Mohit
 * - Kapil
 */
function getParticipantsText(mom){

  return mom.participants
    .map(function(name){

      return "- " + name;

    })
    .join("\n");

}


/**
 * Returns discussion count
 */
function getDiscussionCount(mom){

  return mom.discussions.length;

}


/**
 * Returns participant count
 */
function getParticipantCount(mom){

  return mom.participants.length;

}


/**
 * Converts MOM to plain object
 */
function toObject(mom){

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

    discussions: cloneMOM(mom.discussions),

    recordStatus: mom.recordStatus

  };

}


/**
 * Returns standard engine response
 */
function createResponse(success,message,data){

  return {

    success: success,

    message: message || "",

    data: data || null,

    timestamp: new Date()

  };

}


/**
 * Health Check
 */
function momModelHealthCheck(){

  const mom=createMOM();

  mom.date="03/07/2026";

  mom.startTime="07:00";

  mom.endTime="07:25";

  mom.meetingCode="LM/2627/0208";

  mom.chairedBy="Rakesh Negi";

  mom.agenda="Morning Meeting";

  addParticipant(mom,"Sunil");

  addParticipant(mom,"Mohit");

  addParticipant(mom,"Kapil");

  addDiscussion(mom,"Safety - No accident yesterday");

  addDiscussion(mom,"Production plan reviewed");

  Logger.log(JSON.stringify(toObject(mom),null,2));

  Logger.log("Participants : "+getParticipantCount(mom));

  Logger.log("Discussion : "+getDiscussionCount(mom));

}