# TMQ Master Algorithm v4

One document for the whole detector: authenticity, quality rating, display scale, and tests. It replaces v1 to v3 and the debug brief. It keeps the v3 rubric and caps, fixes the problems found in the current Antigravity implementation, and adds a display scale of 40 to 98.

Companion file: `TMQ_calibration_library.json` (11 real pieces with texts, levels, internal scores and display scores).

## 0. Pipeline

```
Input text
 → 1. Preprocess (genre, stanza rhyme check, N/A rule)
 → 2. Layer A: mechanical features (code, deterministic)
 → 3. Authenticity pass (AI-likelihood band; can hold the rating)
 → 4. Layer B: levels 0 to 4 per metric (LLM, nearest-anchor, quotes verified in code)
 → 5. Caps and gates (code)
 → 6. Internal score S (0 to 100) + Emotional Bias
 → 7. Display transform (S → 40 to 98) and tier label
 → 8. Report + nearest library piece
```

The internal score S drives all tests. The display score D is what writers see. Never compute D from anything except S.

## 1. Review of the current implementation

- Preserved: 13 metrics and maxima, 70 or 59 available points, the levels formula, the Emotional Bias formula, Layer A and B structure, and the 11-piece calibration library.
- Fixed: Generalized legibility gate with line ratio (30% unparsable lines) and word-sense mismatch count, separating typos from semantic misuse.
- Fixed: Generic stock-phrases and expanded emotion lexicons.
- Added: Display Transform function `toDisplay(S)` mapping internal score S (0-100) to displayed score D (40-98).
- Added: Tier labels on D (90-98 Masterwork, 80-89 Excellent, 70-79 Strong, 60-69 Solid, 50-59 Promising, 40-49 Developing).
