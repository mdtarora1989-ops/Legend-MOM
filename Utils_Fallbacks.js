/**********************************************************************
 * Legend MOM Management System
 * ------------------------------------------------------------
 * File    : Utils_Fallbacks.gs
 * Purpose : Utilities - time conversion and parsing fallbacks
 **********************************************************************/

/**
 * Convert a time string to HH:MM (24-hour) where possible.
 * Accepts: "13:30", "1:30 PM", "01:30PM", "1.30 pm", "01:30 PM", "1:30pm", "1pm", etc.
 * Returns "" when unparseable.
 */
function convertTo24h(timeStr) {
  if (!timeStr || String(timeStr).trim() === "") return "";
  var s = String(timeStr).trim();

  // Normalize common separators
  s = s.replace(/\./g, ":").replace(/\s+/g, " ").replace(/：/g, ":");

  // If it's already HH:MM 24h like 13:30 or 07:03
  var m = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (m) {
    var hh = ("0" + m[1]).slice(-2);
    var mm = ("0" + m[2]).slice(-2);
    return hh + ":" + mm;
  }

  // Match 12-hour variants with optional AM/PM
  m = s.match(/^([0-1]?\d)(?::|\.| )?([0-5]?\d)?\s*(am|pm|AM|PM|Am|Pm)?\.?$/);
  if (m) {
    var hour = parseInt(m[1], 10);
    var minute = m[2] ? parseInt(m[2], 10) : 0;
    var ampm = m[3] ? m[3].toLowerCase() : null;

    if (ampm) {
      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;
    } else {
      // No AM/PM: if hour > 23 it's invalid
      if (hour > 23) return "";
    }

    if (minute < 0 || minute > 59) minute = 0;
    var hh = ("0" + hour).slice(-2);
    var mm = ("0" + minute).slice(-2);
    return hh + ":" + mm;
  }

  return "";
}

/**
 * Parse start/end times and chairedBy from raw meeting notes.
 * Returns:
 * {
 *   startTime: "HH:MM" or "",
 *   endTime: "HH:MM" or "",
 *   rawStart: original matched start text or "",
 *   rawEnd: original matched end text or "",
 *   chairedBy: normalized string or "",
 *   rawChairedBy: original matched chaired text or ""
 * }
 */
function parseTimesAndChairFromNotes(notes) {
  notes = String(notes || "");
  var result = {
    startTime: "",
    endTime: "",
    rawStart: "",
    rawEnd: "",
    chairedBy: "",
    rawChairedBy: ""
  };

  // Look for an explicit "Time:" line or "Time" occurrence first
  var timeRangeRe = /(?:\bTime\b[\s:\-]*)([^\n\r]+)/i;
  var mRange = notes.match(timeRangeRe);
  if (mRange && mRange[1]) {
    var rangeText = mRange[1].trim();
    var parts = rangeText.split(/\bto\b|[-–—]|,/i).map(function(s){ return s.trim(); }).filter(Boolean);
    if (parts.length >= 2) {
      var rawS = parts[0], rawE = parts[1];
      var s24 = convertTo24h(rawS);
      var e24 = convertTo24h(rawE);
      if (s24) {
        result.startTime = s24;
        result.rawStart = rawS;
      }
      if (e24) {
        result.endTime = e24;
        result.rawEnd = rawE;
      }
    } else {
      var generalRange = rangeText.match(/([01]?\d[:\.]?[0-5]?\d)\s*(?:to|[-–—])\s*([01]?\d[:\.]?[0-5]?\d)/i);
      if (generalRange) {
        var s24 = convertTo24h(generalRange[1]);
        var e24 = convertTo24h(generalRange[2]);
        if (s24) { result.startTime = s24; result.rawStart = generalRange[1]; }
        if (e24) { result.endTime = e24; result.rawEnd = generalRange[2]; }
      }
    }
  }

  // If not found, search for first occurrence of two times anywhere and pick them
  if ((!result.startTime || !result.endTime)) {
    var timeMatches = notes.match(/([01]?\d[:\.]?[0-5]?\d(?:\s?(?:AM|PM|am|pm)?)?)/g) || [];
    if (timeMatches.length >= 2) {
      var s24 = convertTo24h(timeMatches[0]);
      var e24 = convertTo24h(timeMatches[1]);
      if (s24 && !result.startTime) { result.startTime = s24; result.rawStart = timeMatches[0]; }
      if (e24 && !result.endTime) { result.endTime = e24; result.rawEnd = timeMatches[1]; }
    }
  }

  // permissive search for ranges
  if ((!result.startTime || !result.endTime)) {
    var permissive = notes.match(/([01]?\d[:\.]?[0-5]?\d?\s?(?:AM|PM|am|pm)?)\s*(?:to|[-–—])\s*([01]?\d[:\.]?[0-5]?\d?\s?(?:AM|PM|am|pm)?)/i);
    if (permissive) {
      var s24 = convertTo24h(permissive[1]);
      var e24 = convertTo24h(permissive[2]);
      if (s24 && !result.startTime) { result.startTime = s24; result.rawStart = permissive[1]; }
      if (e24 && !result.endTime) { result.endTime = e24; result.rawEnd = permissive[2]; }
    }
  }

  // Chaired by detection
  var chairRe = /(Meeting\s+Conducted\s+By|Chaired\s+by|Chaired|Chairperson|Chair)\s*[:\-]?\s*([^\n\r]+)/i;
  var chairMatch = notes.match(chairRe);
  if (chairMatch && chairMatch[2]) {
    var rawChair = chairMatch[2].trim();
    result.rawChairedBy = rawChair;
    var cleaned = rawChair.replace(/\[|\]/g, "").trim();
    if (/unclear|uncertain|not clear|unknown/i.test(cleaned)) {
      result.chairedBy = cleaned + " (unclear)";
    } else {
      result.chairedBy = cleaned;
    }
  } else {
    var byRe = /\bBy\s*[:\-]?\s*([^\n\r]+)/i;
    var byMatch = notes.match(byRe);
    if (byMatch && byMatch[1]) {
      var rawChair = byMatch[1].trim();
      result.rawChairedBy = rawChair;
      var cleaned = rawChair.replace(/\[|\]/g, "").trim();
      if (/unclear|uncertain|not clear|unknown/i.test(cleaned)) {
        result.chairedBy = cleaned + " (unclear)";
      } else {
        result.chairedBy = cleaned;
      }
    }
  }

  return result;
}
