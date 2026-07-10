/***************************************************************
 * Legend MOM Management System
 * PromptEngine.js - Central Prompt Generator + OCR Cleanup
 * Version: 2.0 (Enhanced OCR handling + duplicate removal)
 ***************************************************************/

const PromptEngine = (() => {
  const TYPES = {
    MOM: "MOM",
    SOP: "SOP",
    KAIZEN: "KAIZEN",
    CAPA: "CAPA",
  };

  /**
   * Clean OCR text: remove duplicates, fix common errors, normalize whitespace
   */
  function cleanOCRText(text) {
    text = String(text || '');
    
    // Remove multiple repeated sections (OCR often repeats lines)
    var lines = text.split('\n');
    var seen = {};
    var cleaned = [];
    
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Skip lines that are exact duplicates within last 5 lines
      var isDuplicate = false;
      for (var j = Math.max(0, cleaned.length - 5); j < cleaned.length; j++) {
        if (cleaned[j].toLowerCase() === line.toLowerCase()) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        cleaned.push(line);
      }
    }
    
    text = cleaned.join('\n');
    
    // Fix common OCR errors
    text = text.replace(/REPRE5ENTATIVE/g, 'REPRESENTATIVE');
    text = text.replace(/REPRE5ENTATIVE/g, 'REPRESENTATIVE');
    text = text.replace(/Moming/g, 'Morning');
    text = text.replace(/moming/g, 'morning');
    text = text.replace(/\bS\.S\(/g, 'SS(');
    text = text.replace(/рк/g, 'PK');
    text = text.replace(/мк/g, 'MK');
    text = text.replace(/\s+/g, ' ');  // collapse multiple spaces
    text = text.replace(/\(\s+/g, '('); // remove space after (
    text = text.replace(/\s+\)/g, ')'); // remove space before )
    
    // Remove obvious OCR garbage sections
    // Remove repeated "Meeting Details:", "Action Points:", etc if they appear multiple times
    var sections = ['Meeting Details:', 'Action Points:', 'Minutes of Meeting:', 
                    'Agenda of meeting:', 'Meeting Title:', 'Participants Signatures:'];
    
    sections.forEach(function(section) {
      var pattern = new RegExp(section, 'gi');
      var matches = text.match(pattern);
      if (matches && matches.length > 1) {
        // Keep only the first occurrence
        var firstIndex = text.toLowerCase().indexOf(section.toLowerCase());
        var restText = text.substring(firstIndex);
        var firstMatch = section;
        var count = 0;
        for (var idx = firstIndex + section.length; idx < restText.length; idx++) {
          if (restText.substring(idx, idx + section.length).toLowerCase() === section.toLowerCase()) {
            restText = restText.substring(0, idx) + restText.substring(idx + section.length);
            idx -= section.length;
          }
        }
        text = text.substring(0, firstIndex) + restText;
      }
    });
    
    return text.trim();
  }

  function build(type, notes, hints) {
    switch (type) {
      case TYPES.MOM:
        return buildMOM(notes, hints);

      default:
        throw new Error("Unknown Prompt Type : " + type);
    }
  }

  function _formatHints(hints) {
    if (!hints) return "";
    var lines = ["HINTS (optional):"];
    if (hints.startTime) lines.push("- startTime: " + hints.startTime);
    if (hints.endTime) lines.push("- endTime: " + hints.endTime);
    if (hints.chairedBy) lines.push("- chairedBy: " + hints.chairedBy);
    if (hints.rawStart) lines.push("- rawStart: " + hints.rawStart);
    if (hints.rawEnd) lines.push("- rawEnd: " + hints.rawEnd);
    return lines.join("\n") + "\n\n";
  }

  function buildMOM(notes, hints) {
    var hintBlock = _formatHints(hints);
    
    // Clean OCR text before sending to AI
    var cleanedNotes = cleanOCRText(notes);
    
    return `You are an Executive Meeting Minutes Expert specializing in cleaning and parsing OCR-extracted meeting notes.

IMPORTANT: The meeting notes below may contain OCR errors, duplicates, or mixed printed+handwritten content.

Your task:
1. Extract ONLY the actual meeting information (ignore repeated sections, garbage text, or OCR artifacts)
2. Fix obvious OCR errors (e.g., "Moming" → "Morning", "REPRE5ENTATIVE" → "REPRESENTATIVE")
3. Parse dates, times, names, and action items accurately
4. Normalize times to HH:MM 24-hour format (e.g., 07:00, 13:30)
5. Keep only the main discussion points (ignore duplicates)
6. For participants, extract ONLY names (remove corrupted text)
7. Never invent information — if unclear, mark as "Unclear" or leave empty

Rules:
- Never invent information
- Keep chronology
- Keep action items and owners
- Keep target dates (if available)
- Normalize times to HH:MM 24-hour format
- Return ONLY valid JSON — no explanation or surrounding text
- If multiple conflicting values exist, pick the clearest one

HINTS:
${hintBlock}

JSON Format (exact keys expected):
{
  "meetingDate":"",
  "department":"",
  "startTime":"",
  "endTime":"",
  "chairedBy":"",
  "participants":[],
  "agenda":"",
  "discussion":[
    {
      "topic":"",
      "details":"",
      "action":"",
      "owner":"",
      "targetDate":"",
      "status":"Open"
    }
  ]
}

OCR-Extracted Meeting Notes (may contain errors/duplicates):

${cleanedNotes}`;
  }

  return {
    TYPES,
    build,
    cleanOCRText,
  };
})();

function testPromptEngine() {
  const prompt = PromptEngine.build(
    PromptEngine.TYPES.MOM,
    `Production Meeting\n\nExtrusion line speed low\n\nRajesh to improve output by 15%\n\nTarget 30 July`,
    { startTime: '13:30', endTime: '14:30', chairedBy: 'V.B. / V.P. (unclear)' }
  );
  Logger.log(prompt);
}
