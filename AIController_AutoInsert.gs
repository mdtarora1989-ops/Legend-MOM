/**
 * AI Auto Insert Controller
 * Adds a safe wrapper generateAndInsertFromNotes that builds prompt, calls AI,
 * parses output, maps to MOM, detects duplicates (by meetingCode), and inserts.
 */

/**
 * Top-level helper: generate and insert from free-form notes.
 * Returns a structured result object for diagnostics and testing.
 */
function generateAndInsertFromNotes(notes) {
  var result = {
    success: false,
    errors: [],
    aiData: null,
    mom: null,
    meetingCode: null,
    insertedRow: null,
  };

  try {
    // Extract simple hints from raw notes to nudge the model
    var hints = {};
    if (typeof Utils_Fallbacks !== 'undefined' && Utils_Fallbacks.parseTimesAndChairFromNotes) {
      try { hints = Utils_Fallbacks.parseTimesAndChairFromNotes(notes) || {}; } catch (e) { Logger.log('Hints parse error: ' + e.message); }
    }

    var prompt = PromptEngine.build(PromptEngine.TYPES.MOM, notes, hints);

    // Call AI runner - try a couple of known entry points
    var aiRaw = null;
    var attempts = 2;
    for (var a = 0; a < attempts; a++) {
      try {
        if (typeof AIController !== 'undefined' && AIController.runPrompt) {
          aiRaw = AIController.runPrompt(prompt);
        } else if (typeof AIService !== 'undefined' && AIService.generate) {
          aiRaw = AIService.generate(prompt);
        } else if (typeof callExternalAI === 'function') {
          aiRaw = callExternalAI(prompt);
        } else {
          throw new Error('No AI runner available (AIController.runPrompt or AIService.generate)');
        }
        if (aiRaw) break;
      } catch (e) {
        Logger.log('AI call attempt ' + (a+1) + ' failed: ' + e.message);
        if (a < attempts - 1) {
          // wait a bit before retrying (Apps Script sleep)
          if (typeof Utilities !== 'undefined' && Utilities.sleep) Utilities.sleep(800);
        } else {
          throw e;
        }
      }
    }

    // Try to get JSON from aiRaw
    var aiObj = null;
    if (aiRaw === null || aiRaw === undefined) {
      throw new Error('AI returned no response');
    }

    if (typeof aiRaw === 'object') aiObj = aiRaw;
    else if (typeof aiRaw === 'string') {
      // Try parse directly
      try { aiObj = JSON.parse(aiRaw); } catch (e) {
        // Try to extract JSON substring
        var m = aiRaw.match(/\{[\s\S]*\}/m);
        if (m) {
          try { aiObj = JSON.parse(m[0]); } catch (e2) { aiObj = null; }
        }
      }
    }

    result.aiData = aiObj || aiRaw;

    if (!aiObj) {
      result.errors.push({ code: 'ai_parse', message: 'Could not parse AI output as JSON', raw: aiRaw });
      return result;
    }

    // Map AI JSON to MOM using AIMapper
    var mom = AIMapper.mapToMOM(aiObj);
    result.mom = mom;
    result.meetingCode = mom.meetingCode;

    // Duplicate detection by meeting code
    if (typeof SheetService !== 'undefined' && SheetService.meetingExists) {
      if (SheetService.meetingExists(mom.meetingCode)) {
        result.errors.push({ code: 'duplicate', message: 'Meeting with same meetingCode already exists' });
        return result;
      }
    }

    // Validate and insert
    try {
      ValidationEngine.validateOrThrow(mom);
    } catch (vErr) {
      result.errors.push({ code: 'validation', message: vErr.message });
      return result;
    }

    var insertResult = InsertEngine.run(mom);
    // InsertEngine.run is expected to return an object or row number; adapt
    if (insertResult && typeof insertResult === 'object' && insertResult.row) {
      result.insertedRow = insertResult.row;
    } else if (typeof insertResult === 'number') {
      result.insertedRow = insertResult;
    }

    result.success = true;
    Logger.log('generateAndInsertFromNotes: success - meetingCode=' + result.meetingCode + ' row=' + result.insertedRow);
    return result;
  } catch (e) {
    Logger.log('generateAndInsertFromNotes error: ' + (e && e.message ? e.message : e));
    result.errors.push({ code: 'exception', message: e && e.message ? e.message : String(e) });
    return result;
  }
}
