/* InsertEngine compatibility helpers
 * We avoid changing the main InsertEngine; instead provide a small wrapper
 * to normalize return values and allow run(mom) to return metadata.
 */
var InsertEngineCompat = {};

InsertEngineCompat.run = function (mom) {
  // If original InsertEngine.run exists, call it and normalize
  if (typeof InsertEngine !== 'undefined' && InsertEngine.run) {
    try {
      var res = InsertEngine.run(mom);
      // Heuristic: if InsertEngine.run returns nothing, try to detect last row
      if (!res) {
        var row = SheetService.getLastRow();
        return { row: row };
      }
      return res;
    } catch (e) {
      throw e;
    }
  }
  throw new Error('InsertEngine.run not available');
};

InsertEngineCompat.existsByMeetingCode = function (meetingCode) {
  if (typeof SheetService !== 'undefined' && SheetService.meetingExists) return SheetService.meetingExists(meetingCode);
  return false;
};
