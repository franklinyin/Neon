# Stage 1 Schenker notes in Neon

This folder holds tutorial / sample materials for **Stage 1**: inserting a single Schenkerian structural notehead on an existing facsimile-backed score **without** moving or rescaling that score.

Stage 1 is **not** Urlinie, Bassbrechung, beams, stems, or dragging. It is one analytical `<note>` drawn with a normal Verovio notehead.

## Encoding

A structural note is an ordinary MEI `<note>` with:

| Attribute | Meaning |
|---|---|
| `type="schenker"` | Analytical overlay, not a rhythmic CMN event |
| `schenker:x` | Visual-center X in the **existing facsimile / page coordinate space** (same units as zone `ulx`) |
| `loc` | Discrete staff-relative Y (Verovio: `0` = bottom line; `+1` = one half-space up) |

There is **no** `schenker:y`. Vertical position always comes from `loc` on the staff the click landed on.

Existing score geometry stays on `<facsimile>` / `<zone>` / staff `@facs`. Those coordinates are source of truth and are not rewritten when a structural note is added.

Example:

```xml
<note type="schenker" loc="4" dur="1" stem.visible="false" schenker:x="816"/>
```

`dur="1"` exists only so Verovio can draw a whole-note glyph. It must not change measure width, justification, or staff scale.

## Try it: CF-005

1. Serve Neon (`deployment/server`, typically `http://localhost:8080`).
2. Open the dashboard and load **CF-005** (editor URL: `editor.html?manifest=CF-005`).
3. If CF-005 does not appear, clear `localStorage` key `neon-fs` and reload — the sample list is cached.
4. Choose **Insert → Structural Note (○)**.
5. Click on a staff.

Expected result: the scanned page and staff lines stay exactly where they were; only a new notehead appears, centered on the click.

Files for this sample:

| Path | Role |
|---|---|
| `CF-005.mei` / `CF-005.png` (this folder) | Tutorial copies of the historical score + image |
| `deployment/server/samples/mei/CF-005.mei` | Served MEI |
| `deployment/server/samples/img/CF-005.png` | Served image (surface `3232×2480`) |
| `deployment/server/samples/manifests/CF-005.jsonld` | Dashboard manifest |

CF-005 is CMN (two 5-line staves with G and F clefs). Staff placement still uses the original facsimile zones. Neon `convertToVerovio()` copies each `<sb @facs>` onto a runtime `<staff>` and sets `facsimile@type="transcription"`. Do not “fix” overlay alignment by editing `ulx` / `uly` / `lrx` / `lry`.

## Other files in this folder

| File | Role |
|---|---|
| `schenker_mei_template.mei` | Blank-ish Stage 1 encoding template (`xmlns:schenker`, `type="schenker"`, `loc`, `schenker:x`) |
| `schenker_stage1_smoke.mei` | Tiny MEI used by the round-trip script (one note at `loc="4"` `schenker:x="816"`) |
| `247v demo.mei` | Unrelated tutorial MEI (unchanged by Stage 1) |

## Neon code that landed with this work

| File | What changed |
|---|---|
| `src/Dashboard/samples_filenames.ts` | Registers `CF-005` as a folio sample |
| `src/SquareEdit/Contents.ts` | Adds the **Structural Note** insert button |
| `src/SquareEdit/InsertHandler.ts` | Maps that button to `type="schenker"`; click → nearest staff, `yToLoc`, insert payload with `schenker:x` + `loc` |
| `src/utils/SchenkerTools.ts` | `findNearestStaff`, `yToLoc` (5-line staff, loc from staff bbox) |
| `src/Types.ts` | `structuralNote` insert id; insert action can carry `schenker:x` |
| `src/utils/Select.ts`, `SelectTools.ts` | Treat `.note` as a selectable layer element so the new notehead can be clicked |
| `src/workers/VerovioWorker-dev.js` | Loads the local WASM prebundle; waits for `onRuntimeInitialized` before `new verovio.toolkit()`; logs edit JSON |
| `assets/js/verovio-toolkit-wasm.js` | Bundled Verovio toolkit with the Stage 1 C++ path (free-X, Schenker insert routing, no `SetFocus` on this insert) |
| `scripts/stage1a-schenker-roundtrip.js` | Node smoke test against `../verovio/emscripten/build/verovio.js` |

Insert payload (Neon → Verovio):

```json
{
  "action": "insert",
  "param": {
    "elementType": "note",
    "staffId": "<clicked staff xml:id>",
    "ulx": 1918.91,
    "uly": 900,
    "attributes": {
      "type": "schenker",
      "loc": "9",
      "schenker:x": "1918.91"
    }
  }
}
```

`ulx` / `uly` are required by the generic insert parser; for Schenker notes they are **not** stored as the note position. Stored position is `schenker:x` + `loc`.

CF-005 is CMN, so Verovio uses `EditorToolkitShared`, not the neume toolkit. The Shared editor **must not** run `Doc::SetFocus()` for this insert (that rebuilds scoreDef / layout and was what enlarged the staff). After insert, Neon `getMEI` + `renderToSVG` does one transcription layout pass.

## Smoke test

From the Neon repo, after building Verovio WASM:

```sh
node scripts/stage1a-schenker-roundtrip.js
```

It loads `schenker_stage1_smoke.mei` and checks that:

1. A `type="schenker"` note renders.
2. Changing `schenker:x` moves X only.
3. `loc+1` moves one half staff-space up.
4. Export keeps `type`, `loc`, `schenker:x`, and `xmlns:schenker`.
5. Reloading that export keeps the same drawing position.

## Out of scope (ignore if you see them)

- Schema `mei-all.rng` 404 / `5.0.0-dev` → `6.0-dev` fallback
- `@facs 'null'` warnings (empty trailing `<sb facs="null">` in CF-005)
- Production worker still points at verovio.org; development uses `VerovioWorker-dev.js` + the local WASM

Hard-refresh the editor (`Cmd-Shift-R`) after a WASM rebuild so the worker cache-bust query takes effect.

---

## File-by-file

### `Resources for Neon tutorials/CF-005.mei`

Tutorial copy of the CF-005 score encoding. Two 5-line CMN staves (G and F clefs), facsimile surface `3232×2480`, and staff/clef zones. This is the historical layer structural notes sit on; do not rewrite its zone coordinates to “fix” alignment.

### `Resources for Neon tutorials/CF-005.png`

Tutorial copy of the CF-005 page scan. Same image as the served sample (`1.64 MB`).

### `Resources for Neon tutorials/schenker_mei_template.mei`

Reference MEI for how a Stage 1 Schenker graph *could* be encoded (`xmlns:schenker`, `type="schenker"`, `loc`, `schenker:x`). Not loaded by the dashboard. Useful as a schema/encoding sketch, not as the CF-005 editor file.

### `Resources for Neon tutorials/schenker_stage1_smoke.mei`

Minimal MEI used only by `scripts/stage1a-schenker-roundtrip.js`. One staff, one `<note xml:id="schenker-n1" type="schenker" loc="4" dur="1" schenker:x="816"/>`. No facsimile. Verifies free-X + loc render and MEI round-trip, independent of Neon’s UI.

### `assets/js/verovio-toolkit-wasm.js`

Local Verovio WASM prebundle the **dev** worker loads. Contains the C++ Stage 1 path: Shared-toolkit insert of `type="schenker"` notes, `schenker:x` as notehead-center X, skip `Doc::SetFocus()` on that insert so staff scale stays put. Binary; rebuild Verovio and copy here when the C++ side changes. Cache-bust via the worker’s `?v=…` query.

### `deployment/server/samples/img/CF-005.png`

Image served at `samples/img/CF-005.png`. Duplicate of the tutorial PNG so the local `http.server` can open the folio without this folder being on the web root.

### `deployment/server/samples/manifests/CF-005.jsonld`

Neon manifest for the dashboard / `editor.html?manifest=CF-005`. Points `image` at the PNG and `mei_annotations` at the served MEI.

### `deployment/server/samples/mei/CF-005.mei`

MEI actually loaded in the editor. Same content as the tutorial copy. Neon `convertToVerovio()` still rewrites this at runtime (copy `<sb @facs>` onto `<staff>`, `facsimile@type="transcription"`).

### `scripts/stage1a-schenker-roundtrip.js`

Node script: `node scripts/stage1a-schenker-roundtrip.js`. Requires `../verovio/emscripten/build/verovio.js`. Loads the smoke MEI, renders SVG, then checks that `schenker:x` moves X only, `loc+1` moves Y up one half-space, and exported MEI reloads at the same position.

### `src/Dashboard/samples_filenames.ts`

Adds `['CF-005', 'folio']` to the built-in sample list. Dashboard names are also cached in `localStorage` (`neon-fs`); clear that if CF-005 does not show up.

### `src/SquareEdit/Contents.ts`

Insert-tab HTML: new button `id="structuralNote"` labeled **Structural Note (Schenker)** (`○`). Lives on the primitive insert tab next to the neume / accidentals buttons.

### `src/SquareEdit/InsertHandler.ts`

Maps `structuralNote` → `elementType: 'note'` with `attributes.type = 'schenker'`. On click: `getSVGRelCoords` (same space as facsimile zones), `findNearestStaff`, `yToLoc`, then an `insert` action with `staffId`, dummy `ulx`/`uly` (parser requirement), and persisted `loc` + `schenker:x`. Does not store `schenker:y`.

### `src/Types.ts`

`InsertType` includes `'structuralNote'`. `InsertAction.param.attributes` is already `Record<string, string>`, which is how `loc` and `schenker:x` ride on the edit JSON.

### `src/utils/SchenkerTools.ts`

New helper module. `findNearestStaff(x, y)` picks the staff whose bbox is closest to the click. `yToLoc(y, staff)` maps facsimile Y onto discrete `@loc` using the rendered 5-line staff bbox (`loc 0` = bottom line).

### `src/utils/Select.ts`

Layer-element multi-select class list includes `.note` (`selByLayerElement: '.accid, .note'`) so a structural notehead can be added to / removed from a selection like other layer glyphs.

### `src/utils/SelectTools.ts`

`selByLayerElement` grouping selectors include `.note`. Click-select and “not part of specified group” fallback treat a `.note` as a layer element, same as clef / custos / accid / divLine.

### `src/workers/VerovioWorker-dev.js`

Development Verovio worker (not the production one that hits verovio.org). `importScripts` the local WASM with a cache-bust query (`?v=schenker-skip-setfocus`). Waits for `Module.onRuntimeInitialized` (and a poll fallback) before `new verovio.toolkit()`. Options include `useFacsimile: false`. Logs each `edit` payload. Handles `renderData`, `edit`, `getMEI`, `renderToSVG`.

### `yarn.lock`

Lockfile churn from installing / resolving packages while this work was added. No Stage 1 behavior lives here.
