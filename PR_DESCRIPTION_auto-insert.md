# PR: feat(auto-insert): robust AI insert flow, duplicate prevention, structured results, and tests

This branch adds a robust end-to-end AI Auto Insert flow with structured return values, duplicate detection, retries, and a debug test helper.

## Summary

- Adds generateAndInsertFromNotes(notes) to centralize the AI prompt -> parse -> map -> validate -> insert flow.
- Adds AutoInsertUtils and InsertEngine compatibility wrapper to normalize behavior and provide duplicate checks.
- Adds DebugHelpers_AutoInsert.gs with runAutoInsertSample() to exercise the flow and log results.

## Files added/updated in this PR
- AIController_AutoInsert.gs (new/updated)
- AutoInsertUtils.js (new)
- InsertEngine_Compat.js (new)
- DebugHelpers_AutoInsert.gs (new)

## How to test
1) In VS Code or Apps Script editor, fetch and switch to the feature branch:
   git fetch origin
   git checkout feature/auto-insert-complete

2) In Apps Script editor (or via clasp), ensure the project is updated (clasp pull / clasp push if needed).

3) Run health checks (App Script editor or clasp):
   - promptEngineHealthCheck()
   - aiMapperHealthCheck()

4) Run the auto-insert sample test (Apps Script editor or clasp):
   - runAutoInsertSample()

5) Inspect the log output; look for:
   - `AutoInsert result: { ... }` — the JSON contains aiData, mom, meetingCode, insertedRow, and any errors.

6) Validate the spreadsheet:
   - Confirm the meeting row was inserted (check meetingCode and row number).
   - Rerun runAutoInsertSample() — the second run should detect a duplicate and not insert another row.

## Notes & Next steps
- Duplicate strategy currently uses SheetService.meetingExists(meetingCode). We may extend to hash-based detection for fuzzier duplicates.
- The AI runner wrapper tries AIController.runPrompt and AIService.generate — ensure your project exposes one of these entry points.
- If the AI JSON parsing fails, the result.aiData will contain the raw AI output and the error (ai_parse).

