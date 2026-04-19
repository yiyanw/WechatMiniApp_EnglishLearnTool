---
name: gen-sentences
description: Generate SENTENCES array from a whisper transcription JSON file. Provide whisper JSON path and output JS path as arguments.
---

Given a whisper transcription JSON file, generate the `SENTENCES` array for `sentences.js`.

## Input

$ARGUMENTS - two paths separated by space:
1. Path to the whisper result JSON file (e.g., `/tmp/whisper_result.json`)
2. Path to the output `sentences.js` file (e.g., `miniprogram/data/sentences.js`)

Example: `/tmp/whisper_result.json miniprogram/data/sentences.js`

## Steps

### 1. Parse whisper JSON structure

Read the whisper result JSON. It contains:
- `segments`: array of `{id, start, end, text}` — text includes punctuation
- `words`: array of `{word, start, end}` — no punctuation, timestamps per word

### 2. Identify story boundaries

- Skip intro segments (book title, author, publisher info) before the first date header
- Skip outro segments (e.g., "Thank you for watching")
- Story starts at the first segment beginning with a date pattern like "August DD, 2030"

### 3. Identify chapters from segments

Each chapter starts when a **segment's text begins** with a date pattern (e.g., `^August \d+,?\s*2030`). Do NOT split on dates that appear mid-sentence (e.g., "It is August 15, 2030, and an email...").

For each chapter, collect:
- `header`: the date text (e.g., "August 15, 2030")
- `parts`: remaining text from that segment + all subsequent segments until the next chapter

### 4. Split into sentences

Within each chapter's concatenated content:
1. **Protect abbreviations** before splitting: replace `Mr.`, `Mrs.`, `Dr.`, `S.` (before uppercase) with a placeholder to avoid false splits
2. **Split** on sentence-ending punctuation followed by whitespace: `(?<=[.!?])\s+`
3. **Restore** abbreviation placeholders

### 5. Merge dialog attributions

If a sentence starts with `says`, `asks`, `say`, or `ask` (case-insensitive), merge it with the preceding sentence. This keeps "But why? asks Mrs. Fuller." as one unit.

### 6. Merge short fragments

Run forward-merge passes (up to 3 iterations) to combine very short entries (< 4 words) with the next entry. Rules:
- Never merge across chapter boundaries
- Never merge into/from a date header entry
- If forward merge is impossible, try backward merge
- Stop when no more merges are needed

### 7. Map timestamps via word cursor

Use the word-level timestamps array for precise start/end times:
1. Find the first story word (matching the first date header's timestamp)
2. Maintain a global word cursor index
3. For each sentence, count its words using `re.findall(r"[A-Za-z0-9']+", text)` — this naturally handles `$50,000` as 2 tokens (`50`, `000`), matching whisper's tokenization
4. Align the first word by searching up to 5 positions ahead in the word list
5. Start time = first matched word's start; End time = last matched word's end
6. Advance cursor past the consumed words
7. Round all timestamps to 1 decimal place

### 8. Add Chinese translations

Translate each English sentence to Chinese:
- Use standard Chinese punctuation
- Use `{LQ}` / `{RQ}` placeholders for Chinese quotation marks (U+201C / U+201D) in the Python source to avoid encoding issues with the Write tool
- Replace placeholders at runtime with `chr(0x201c)` / `chr(0x201d)`

### 9. Generate JavaScript output

Write to the specified output path via Python's `open()` (not the Write tool) to preserve Unicode characters. If the output file already exists, read its `AUDIO_URL` value first to preserve it:

```javascript
var AUDIO_URL = "cloud://...";

var SENTENCES = [
  {
    "id": "1_1",
    "en": "...",
    "zh": "...",
    "start": 22.3,
    "end": 25.9
  },
  ...
]

module.exports = {
  SENTENCES: SENTENCES,
  AUDIO_URL: AUDIO_URL
};
```

ID format: `x_y` where `x` = chapter number (sequential, each date header = new chapter), `y` = sentence number within chapter (starting from 1, where 1 is always the date header itself).

### 10. Validate

Run `node -e "const d = require('<output_path>'); ..."` (using the specified output path) to verify the output is valid JavaScript and counts are correct.

## Key gotchas

- **Chinese quotation marks**: The Write tool converts U+201C/U+201D to ASCII `"`. Use Python `chr(0x201c)`/`chr(0x201d)` at runtime and write via `open()`.
- **Dollar amounts**: `$50,000` in segment text becomes `50` + `000` as two whisper words. The regex `[A-Za-z0-9']+` naturally handles this.
- **Repeated dates**: The same date (e.g., "August 18, 2030") can appear multiple times as separate chapter headers — each occurrence starts a new chapter.
- **Section titles**: Text like "A Better America" (not a date) appearing between chapters should be treated as content within the chapter, not a chapter boundary.
- **Contractions**: Whisper keeps `don't`, `I'm`, `It's` as single words — the word counter handles this correctly.
- **AUDIO_URL**: If the output file already exists, read and preserve its `AUDIO_URL`. Otherwise, prompt the user for the value.
