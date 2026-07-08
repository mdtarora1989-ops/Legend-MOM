/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * Module  : AIMapper.js
 * Version : 1.1 (tolerant)
 * Purpose : Convert AI JSON into MOM Object (more tolerant parsing)
 * CHANGELOG: added tolerant mapping for participants/discussion
 **********************************************************************/

var AIMapper = {};

/**
 * Helper: ensure value is string
 */
function _toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

/**
 * Normalize participants input into array of names
 */
function _extractParticipants(raw) {
  var list = [];
  if (!raw && raw !== 0) return list;
  if (Array.isArray(raw)) {
    raw.forEach(function (item) {
      if (!item && item !== 0) return;
      if (typeof item === 'string') {
        item.split(/\r?\n|,/).forEach(function (p) {
          p = p.replace(/^[-\s]*/, '').trim();
          if (p) list.push(p);
        });
      } else if (typeof item === 'object') {
        var name = item.name || item.fullName || item.display || item.participant || item.person || "";
        name = _toStr(name).replace(/^[-\s]*/, '').trim();
        if (name) list.push(name);
        else if (item.first || item.last) {
          var f = (item.first || '') + ' ' + (item.last || '');
          f = f.trim();
          if (f) list.push(f);
        }
      }
    });
    return list;
  }
  if (typeof raw === 'string') {
    String(raw).split(/\r?\n|,/).forEach(function (p) {
      p = p.replace(/^[-\s]*/, '').trim();
      if (p) list.push(p);
    });
    return list;
  }
  return list;
}

/**
 * Normalize discussion array into array of detail strings (will preserve structured fields in objects)
 */
function _extractDiscussion(raw) {
  var out = [];
  if (!raw && raw !== 0) return out;
  if (Array.isArray(raw)) {
    raw.forEach(function (item) {
      if (!item && item !== 0) return;
      if (typeof item === 'string') {
        out.push(item.trim());
      } else if (typeof item === 'object') {
        var text = item.details || item.topic || item.text || item.description || '';
        text = _toStr(text).trim();
        var extras = [];
        if (item.action) extras.push('Action: ' + _toStr(item.action).trim());
        if (item.owner) extras.push('Owner: ' + _toStr(item.owner).trim());
        if (item.targetDate) extras.push('Target: ' + _toStr(item.targetDate).trim());
        if (item.status) extras.push('Status: ' + _toStr(item.status).trim());
        if (extras.length) {
          if (text) text = text + ' (' + extras.join('; ') + ')';
          else text = extras.join('; ');
        }
        if (text) out.push(text);
      }
    });
    return out;
  }
  if (typeof raw === 'string') {
    String(raw).split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (line) out.push(line);
    });
    return out;
  }
  return out;
}

/**
 * Converts AI JSON into MOM Object
 */
AIMapper.mapToMOM = function (ai) {
  var mom = MOMBuilder.create();

  // ---------- Header ----------
  mom.date = ai.meetingDate || ai.date || '';
  mom.startTime = ai.startTime || ai.start_time || ai.start || '';
  mom.endTime = ai.endTime || ai.end_time || ai.end || '';
  mom.meetingCode = ai.meetingCode || MeetingCodeEngine.generate();
  mom.meetingType = ai.meetingType || ai.type || CONFIG.DEFAULT_MEETING_TYPE;
  mom.location = ai.location || CONFIG.DEFAULT_LOCATION;
  mom.chairedBy = ai.chairedBy || ai.chair || ai.chaired_by || '';
  mom.agenda = ai.agenda || ai.topic || ai.subject || '';
  mom.recordStatus = ai.recordStatus || ai.recordStatus || CONFIG.DEFAULT_RECORD_STATUS;

  // ---------- Participants ----------
  var participants = [];
  if (ai.participants) participants = _extractParticipants(ai.participants);
  else if (ai.attendees) participants = _extractParticipants(ai.attendees);
  else if (ai.people) participants = _extractParticipants(ai.people);

  participants.forEach(function (p) {
    MOMBuilder.addParticipant(mom, p);
  });

  // ---------- Discussion ----------
  var discussion = [];
  if (ai.discussion) discussion = _extractDiscussion(ai.discussion);
  else if (ai.items) discussion = _extractDiscussion(ai.items);
  else if (ai.points) discussion = _extractDiscussion(ai.points);
  else if (ai.notes) discussion = _extractDiscussion(ai.notes);

  if (discussion.length === 0 && typeof ai.discussion === 'string') {
    discussion = _extractDiscussion(ai.discussion);
  }

  discussion.forEach(function (d) {
    MOMBuilder.addDiscussion(mom, d);
  });

  // Do NOT auto-fill agenda from the first discussion.
  // If agenda was not provided, leave it blank so the original notes/prompt are respected.

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
      { topic: "Production", details: "Increase extrusion output" },
      { topic: "Safety", details: "Check fire extinguishers" }
    ]
  };

  var mom = AIMapper.mapToMOM(sample);
  Logger.log(JSON.stringify(mom, null, 2));
}
