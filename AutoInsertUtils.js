/* AutoInsertUtils.js
 * Small helpers used by the auto-insert flow (hashing + helpers)
 */

var AutoInsertUtils = {};

AutoInsertUtils.computeHash = function (obj) {
  try {
    var s = JSON.stringify(obj || {});
    // simple hash (djb2) to avoid adding crypto libs
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h) + s.charCodeAt(i);
      h = h & h; // keep in 32-bit
    }
    return 'h_' + (h >>> 0).toString(36);
  } catch (e) {
    return 'h_fallback_' + (new Date()).getTime();
  }
};

AutoInsertUtils.isMeetingCodeDuplicate = function(meetingCode) {
  if (!meetingCode) return false;
  if (typeof SheetService !== 'undefined' && SheetService.meetingExists) return SheetService.meetingExists(meetingCode);
  return false;
};
