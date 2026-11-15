---
name: cellar-clean-photos
description: Give every bottle in the owner's Cellar wine app (Firebase project my-cellar-732a4) a clean product photo as its FIRST photo, in the standard 1080x1080 white-square format (like the Kishor GSM photo). Finds images with Claude Code's own search agents, never the app's Anthropic API key or its Cloud Functions. Use when the user asks to add, fix, update, refresh or standardize clean/studio/product bottle photos or images in their cellar or wishlist, or says new bottles need clean images.
---

# Cellar: clean bottle photos

Goes over the cellar, finds every wine whose first photo is not a clean photo in the standard format,
and fixes it: search (with your agents) → check against the owner's label photo → standardize →
upload as the first photo.

## Rules
- **Never use the app's Anthropic API key, its Cloud Functions, or any feature that spends it.** Searching
  is done here, with subagents (WebSearch / WebFetch). The owner explicitly does not want their key
  doing image searches.
- Data access is the Firebase CLI login (`firebase login`, the owner's Gmail), through `scripts/fb.cjs`.
  Invoking this skill is the owner's permission to read the wines and write photos. Touch nothing else
  (no other fields, no deletes beyond replaced clean photos and orphaned `clean-*` files).
- Every write is conditional on the wine not having changed since it was read; if `put.cjs` reports a
  conflict, rerun `status.cjs` and retry that wine.
- **Output format is fixed** (`scripts/standardize.cjs`): 1080x1080 JPEG, white background, bottle trimmed
  of shop margins, 896 px tall (83%, as in the approved Kishor GSM photo), centred; thumbnail 480x480;
  photo tagged `cleanFormat: "square1080-v1"` and `source: <product page URL>`. Do not change it unless the
  owner asks; if you do, bump the FORMAT tag so status.cjs re-flags old photos.
- Run the scripts **outside the sandbox** (they need the network: Firebase, shops, `npm root -g`). Use a
  work directory in the session scratchpad, e.g. `$SCRATCH/cellar-photos`.

## Steps

1. **Status.** `node ~/.claude/skills/cellar-clean-photos/scripts/status.cjs <workdir>`
   Lists every wine as `ok` or `TODO` (no clean photo / old format), writes `<workdir>/todo.json` and the
   owner's own label photos to `<workdir>/own/<wineId>.jpg`. If nothing is TODO, report that and stop.
   A wine with no own photo (added manually) can still get a clean photo; match by name and details only,
   and say so in the report.

2. **Look at each label** (`Read` the `own/<id>.jpg`): note the exact label design, colours, text,
   language, edition (e.g. kosher), vintage. This is the reference for matching.

3. **Search, in parallel: one general-purpose subagent per wine** (several in one message). Brief each with:
   > Find web pages with a clean product photo (single bottle, plain white or studio background) of this exact wine: <producer, wine, vintage, region/country, type>. The label looks like: <your description from step 2>. Prefer the winery's own site, then wine shops; the same vintage is ideal, the same label design for another vintage is acceptable, a different label design is not. Use WebSearch (several queries; try the producer + "winery" + region, and the local-language name) and WebFetch to confirm pages. Return up to 4 product page URLs, best first, each with the direct bottle image URL if you can see it (og:image or main product image), the vintage shown, whether it is the same edition, and a one-line note. Do not download anything else.

   If an existing clean photo is only in the old format (status says so) and its `source` page is still a
   good match, you can skip the search for that wine and reuse that page.

4. **Candidates.** `node .../scripts/candidates.mjs <workdir> <label> <page or image URL> ...`
   Saves each candidate already standardized (exactly what would be uploaded) to `<workdir>/candidates/`.
   For candidates given as image URLs, edit the `.src` file so `"page"` is the product page.
   It warns when the source bottle is under 600 px tall (will look soft): prefer a sharper one if any.

5. **Choose: look at every candidate (`Read`) next to the owner's photo.** Accept only if:
   - same producer, same cuvée, **same label design** (layout, colours, logo, text);
   - a clean product shot: one bottle, label facing front, plain/studio background, no hands or people,
     no watermark, the whole bottle in frame;
   - a different vintage year or a missing edition line (e.g. "KOSHER") is acceptable; note it in the report.
   Prefer, in order: the exact label; the same design with small differences (vintage, an edition line,
   text order or wording, capsule colour); then the clearest image. The owner has said a near-match is
   fine when no exact one exists ("use whatever image you want"), so don't hold a wine back for a small
   label difference: upload the closest clean shot and name the difference in the report.
   Still reject: a different wine or cuvée, lifestyle or multi-bottle shots, hands in the frame, heavy
   watermarks. Prefer a sharp image (source bottle ≥ 600 px tall) over a blurry exact one. If nothing
   usable exists, leave the wine as is and report why. Never upload an image you haven't looked at.

6. **Upload.** `node .../scripts/put.cjs <wineId> <candidateFile>` per chosen wine. It replaces any older
   clean photo (deleting its files) and keeps the owner's photos after it.

7. **Verify.** `node .../scripts/verify.cjs`
   Confirms every first photo loads at 1080x1080 with a 480x480 thumbnail and the format tag, and deletes
   orphaned `clean-*` files. Exit code 2 means some wine is still TODO or failed: report which.

8. **Report** to the owner as a table: wine | photo from (site) | differences from their bottle (vintage,
   edition, wording) | or why none was found. Mention that their own photo is kept as the second photo
   and they can remove the clean one with ✕ in the app.
