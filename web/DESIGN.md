---
name: Cellar
description: A personal wine cellar drawn as a vintage chart; every bottle's drinking window on one shared year axis with a single "now" line.
colors:
  ink: "#15171c"
  ink-dark: "#eceef2"
  ground: "#f4f6f8"
  ground-dark: "#101216"
  surface: "#ffffff"
  surface-dark: "#1a1d23"
  well: "#e7eaee"
  well-dark: "#252930"
  line: "#dde1e6"
  line-dark: "#2c3038"
  fg-soft: "#393e47"
  fg-soft-dark: "#cdd1d8"
  fg2: "#4f5662"
  fg2-dark: "#a3a9b4"
  fg3: "#5f6672"
  fg3-dark: "#8a909b"
  focus: "#5a616d"
  focus-dark: "#a3a9b4"
  hold: "#a6b2c0"
  hold-dark: "#7d8b9c"
  ready: "#8db498"
  ready-dark: "#77a684"
  peak: "#d6a63e"
  peak-dark: "#e0b04a"
  peak-lt: "#e6bf63"
  peak-lt-dark: "#f0cb72"
  soon: "#dc9670"
  soon-dark: "#d4906c"
  past: "#d49aa3"
  past-dark: "#c47e8a"
  t-hold: "#4a5d72"
  t-hold-dark: "#a9bbd0"
  t-ready: "#3d6c4f"
  t-ready-dark: "#92cfa4"
  t-peak: "#8a6413"
  t-peak-dark: "#ecc46b"
  t-soon: "#96492a"
  t-soon-dark: "#f0aa86"
  t-past: "#9e4c5a"
  t-past-dark: "#eba0ac"
  on-peak: "#3a2905"
  on-peak-dark: "#2e2003"
  photo-tile: "#ffffff"
  type-red: "#7a2335"
  type-white: "#d9c27a"
  type-rose: "#e8a0a8"
  type-sparkling: "#c9b97a"
  type-dessert: "#c98a2e"
  type-fortified: "#6b3a2a"
  type-orange: "#d9813a"
  type-unknown: "#a6b2c0"
typography:
  display:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: "36px"
    letterSpacing: "-0.025em"
  headline-sm:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: "24px"
    letterSpacing: "-0.02em"
  title-sm:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  row-title:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: "20px"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  callout:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "16px"
  meta:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  axis:
    fontFamily: "'Bricolage Grotesque Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: "16px"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
rounded:
  lg: "8px"
  segment: "10px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  section: "20px"
  ribbon-track: "112px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.2xl}"
    padding: "12px 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.2xl}"
    padding: "12px 20px"
    height: "48px"
  button-pill:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-pill-quiet:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  scan-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.full}"
    size: "56px"
  chip-filter:
    backgroundColor: "{colors.well}"
    textColor: "{colors.fg2}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  chip-filter-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  segment-track:
    backgroundColor: "{colors.well}"
    textColor: "{colors.fg2}"
    typography: "{typography.label}"
    rounded: "{rounded.segment}"
    padding: "2px"
    height: "36px"
  segment-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  search-field:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "40px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "10px 12px"
  status-chip-peak:
    backgroundColor: "{colors.peak}"
    textColor: "{colors.on-peak}"
    typography: "{typography.callout}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  status-chip-ready:
    textColor: "{colors.t-ready}"
    typography: "{typography.callout}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  tag:
    backgroundColor: "{colors.well}"
    textColor: "{colors.fg-soft}"
    typography: "{typography.callout}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  wine-row:
    typography: "{typography.row-title}"
    padding: "8px 0"
  bottle-thumb:
    backgroundColor: "{colors.photo-tile}"
    rounded: "{rounded.lg}"
    width: "44px"
    height: "56px"
  bottle-thumb-tonight:
    backgroundColor: "{colors.photo-tile}"
    rounded: "{rounded.xl}"
    width: "64px"
    height: "88px"
  tonight-card:
    rounded: "{rounded.3xl}"
    padding: "{spacing.gutter}"
  detail-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.gutter}"
  ribbon-row:
    height: "6px"
    rounded: "{rounded.full}"
  ribbon-row-peak:
    backgroundColor: "{colors.peak}"
    height: "10px"
    rounded: "{rounded.full}"
  ribbon-large:
    height: "14px"
    rounded: "{rounded.full}"
  ribbon-large-peak:
    backgroundColor: "{colors.peak}"
    height: "22px"
    rounded: "{rounded.full}"
  now-line:
    backgroundColor: "{colors.ink}"
    width: "2px"
  tab-bar:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.fg3}"
    typography: "{typography.axis}"
  tab-item-active:
    textColor: "{colors.ink}"
    height: "44px"
  page-header:
    backgroundColor: "{colors.ground}"
    typography: "{typography.title-sm}"
    height: "48px"
---

# Design System: Cellar

## Overview

**Creative North Star: "The Vintage Chart"**

Cellar is drawn the way a wine merchant's vintage chart is printed: every bottle is one row, its life is a coloured ribbon on a shared year axis, and a single vertical "now" line runs down through every row. "What do I open?" is answered by looking down that one line. The surface brief for the build is `.impeccable/surfaces/cellar.md`; this file records what the build actually shipped.

The world is cool and quiet so the chart can speak. A mineral grey-blue ground, near-black ink as the only tint, and no brand colour at all; the five drinking stages (hold, ready, peak, drink soon, past) carry every bit of chroma on screen. One variable grotesque, Bricolage Grotesque, does all the type work through weight and optical size, with tabular figures wherever a year appears. Bottle photos are the only imagery: small portrait tiles, always on white.

Density is a phone list: rows about 72px tall, inset 16px from the screen edges, grouped by urgency under section headers that double as the axis legend. Light and dark follow the phone's `prefers-color-scheme`; every colour is a custom property with a light and a dark value, so nothing is hard-coded to one appearance. The interface is still at load (no authored entrance motion, by choice); motion is limited to press feedback and disclosure.

**Key Characteristics:**
- One shared year axis per list, one continuous "now" line across rows and section headers.
- Stage colours are the only chroma; ink is the only tint for actions and selection.
- Gold means "at its best" and is never decoration.
- One family (Bricolage Grotesque Variable, opsz axis), tabular lining figures for years and counts.
- Bottle photo tiles stay white in both appearances.
- Translucent ground-coloured chrome (header, tab bar) with a centred ink scan button.

## Colors

A cool mineral neutral system with one ink, plus a five-step stage scale that does all of the expressive work. Light values are the base keys; each has a `-dark` sibling used under `prefers-color-scheme: dark`. In code, use the semantic Tailwind names (`bg-ground`, `text-fg2`, `bg-peak`, `text-t-ready`); they resolve through the `:root` custom properties in `src/index.css`.

### Primary
- **Cellar Ink** (`ink`, the `--fg` property): text, the "now" line, the active filter chip, the primary button, the scan button, the active tab. It is the only colour that means "act" or "selected". It inverts in dark mode (near-white on near-black), so ink-filled controls use the ground or surface colour for their label.

### Secondary
The drinking stages, each as a fill (ribbons, chips, tints) and a darker/lighter **text tone** (`t-*`) that holds contrast on the ground.
- **Slate Hold** (`hold` / `t-hold`): not ready yet; the opening band of a ribbon.
- **Sage Ready** (`ready` / `t-ready`): drinking well; the long middle of a ribbon.
- **Peak Gold** (`peak`, `peak-lt` / `t-peak`, `on-peak` for text on a gold fill): at its very best. The peak band is drawn as a thicker pill over the ribbon with a light-gold-to-gold-to-light-gold gradient.
- **Terracotta Soon** (`soon` / `t-soon`): drink this year or next.
- **Dusty Rose Past** (`past` / `t-past`): past its best; the closing band of a ribbon. Errors and destructive actions borrow this family (`t-past` text, `past` mixed 16-26% into the surface for message backgrounds).

### Tertiary
- **Wine-type swatches** (`type-red`, `type-white`, `type-rose`, `type-sparkling`, `type-dessert`, `type-fortified`, `type-orange`, `type-unknown`): data colour only, for the 10px type dot on the bottle page and the placeholder bottle drawing when a wine has no photo. Never used for UI.

### Neutral
- **Mineral Ground** (`ground`): the page, the translucent header and tab bar, and the label colour on ink-filled controls.
- **Raised Surface** (`surface`): detail cards, form fields, the selected segment, secondary buttons.
- **Well** (`well`): inset controls (search field, segment track, filter chips, tags), row press state, photo-less tiles.
- **Hairline** (`line`): row dividers, card rings, the tab bar's top edge, star tracks.
- **Soft Ink** (`fg-soft`), **Second Ink** (`fg2`), **Third Ink** (`fg3`): body-adjacent text, meta lines, then captions, axis years and inactive tabs, in that order of emphasis.
- **Focus** (`focus`): the 2px focus ring on fields and the search well.
- **Photo Tile** (`photo-tile`): the white behind clean product photos, kept white in dark mode (the photo is dimmed to 94% brightness there instead).

**Legacy aliases.** The forms and the bottle page still use older Tailwind names, mapped in `@theme` onto the same tokens: `white` = surface; `wine-50`/`wine-100` = well, `wine-200` = line, `wine-500` = focus, `wine-600..900` = ink; `cream-50` = surface, `cream-100` = ground, `cream-200` = well; `ink-200` = line, `ink-300` = fg3, `ink-500` = fg2, `ink-700` = fg-soft, `ink-900` = ink; `rose-*`/`red-700` = the past family. They exist so older screens follow the system; new work uses the semantic names, and despite the name nothing in `wine-*` is a wine colour.

### Named Rules
**The Only Tint Rule.** Ink is the one colour that marks action and selection. There is no accent hue, no brand colour, and no tinted button; if a control needs to stand out, it is filled with ink.

**The Stage Owns Chroma Rule.** Every saturated colour on screen means a drinking stage. A colour that does not say hold, ready, peak, soon or past does not belong on the ground.

**The Gold Means Best Rule.** Gold appears only where it means "at its best": the peak stage (ribbon pill, status chip, status text) and the fill of the owner's own star ratings. Never as decoration, a border, a button or a highlight colour.

## Typography

**Display Font:** Bricolage Grotesque Variable (with -apple-system, SF Pro Text, system-ui fallback)
**Body Font:** the same family
**Label/Mono Font:** the same family, with tabular lining figures

**Character:** One self-hosted variable grotesque (`@fontsource-variable/bricolage-grotesque/opsz.css`) with `font-optical-sizing: auto`, so the 34px title gets the tight, characterful display cut and 11px axis years get the open text cut from the same file. Hierarchy comes from size, weight (400 to 700) and tracking, never from a second family. The legacy `font-serif` name resolves to the same family.

### Hierarchy
- **Display** (700, 34px/40px, -0.025em): the list title ("Cellar", "Wishlist"), followed on the same baseline by the bottle count in body-sm 500 second ink.
- **Headline** (700, 30px/36px, -0.025em, balanced wrap): the wine's name on its own page.
- **Headline Small** (700, 28px/32px, -0.025em, balanced wrap): the wine's name in the Open tonight card.
- **Title** (700, 20px/24px, -0.02em): list section headers ("At its peak", "Open tonight") and sheet titles; the count beside a section header is label-size, third ink.
- **Title Small** (700, 17px, -0.01em): detail card headings and the page header title.
- **Row Title** (600, 15px/20px, -0.01em): a bottle's name in a list row, truncated to one line.
- **Body** (400, 16px, 1.5): default copy, buttons, and every input (16px stops iOS zooming into focused fields).
- **Body Small** (400, 15px, 1.5): notes, drinking notes, tasting notes.
- **Callout** (400, 14px/20px): the Tonight advice line (lead clause in 600 ink, the rest second ink, pretty wrap), label/value rows on the bottle page, tags, status chips.
- **Label** (600, 13px/16px): filter chips, the segment; the Tonight meta line uses this size at 400.
- **Meta** (400 or 500, 12px/16px, tabular): row meta ("Producer · flag vintage"), row status lines in their stage text tone, field labels.
- **Axis** (600, 11px/16px, tabular): axis years, the "Now" label, tab labels, the version line.

### Named Rules
**The Tabular Years Rule.** Any year, count, price or bottle quantity is set with tabular lining figures (`tnum` utility) so years align down the chart.

**The One Family Rule.** Bricolage Grotesque Variable sets every word. Emphasis is weight and size; there are no uppercase eyebrows, letter-spaced labels or second faces.

## Layout

A single centred column, at most 512px wide, used unchanged on desktop (the phone layout sits in the middle of the window). The list screen keeps 144px of bottom padding so the last row clears the tab bar.

- **Gutter:** 16px on both sides for every block: headers, the Tonight card, the search field, chips, section headers and rows.
- **Rows:** each row is inset 16px (margin, not padding), so the hairline dividers between rows run from content edge to content edge rather than across the screen. Row content: a 44x56px photo tile, a 12px gap, the text column (name, meta, status line), a 12px gap, then the 112px ribbon track. Rows have 8px vertical padding around the tile.
- **The chart axis:** list rows share one axis covering two years back and eight ahead of today. The ribbon track (112px, `TRACK` in `WineCard.tsx`) is the same column in rows and section headers, so the "now" line, drawn per row from edge to edge and continued through each following section header above its label, reads as one unbroken vertical. Row ribbons fade out over 6px at each end of the track.
- **Section headers:** 20px above, 6px below; the title on the left, the axis legend in the track on the right ("Now" in ink, one mid-axis year only when today is well left of it, the axis end year at the right edge, a 6px tick under "Now"). By choice there are no year labels to the left of "Now".
- **Rhythm:** 4 / 8 / 12 / 16 / 20px. 8px between stacked controls (search, segment, chip row), 12px between detail cards and between row elements, 16px inside cards.
- **Filter row:** scrolls horizontally on phones (scrollbar hidden), wraps at 640px and up. A 1px hairline separates sort/ready from the type filters.
- **Chrome:** a sticky 48px page header and a fixed bottom tab bar, both respecting safe-area insets (`pt-safe`, `pb-safe`, minimum 12px).
- **Touch targets:** 44pt minimum height for tappable controls (tabs, the Manually link, back, clear-search, pill buttons, disclosure summaries), extended with invisible padding where the visible mark is smaller (the 32px photo-remove disc sits in a 44px button).

## Elevation & Depth

Flat by default. Depth comes from tone (ground, then well for inset controls, then surface for raised cards) and 1px hairline rings, not from shadows. Shadows appear only in four places, each with a job: the floating scan button (lifted off the tab bar, with a 4px ground-coloured collar that cuts it out of the bar), the selected segment thumb, the peak status chip and the large peak ribbon (a soft gold halo), and full-size bottle photos. The header and tab bar are translucent ground (75-80%) with a 24px backdrop blur and 150% saturation, so rows scroll visibly beneath them.

### Shadow Vocabulary
- **Scan lift** (`box-shadow: 0 8px 20px rgb(0 0 0 / 0.24), 0 0 0 4px var(--ground)`): the centred scan button only.
- **Segment thumb** (`box-shadow: 0 1px 3px rgb(0 0 0 / 0.12)`): the selected half of the In the cellar / Finished segment.
- **Peak halo** (`box-shadow: 0 0 0 3px color-mix(in oklab, var(--peak) 22%, transparent)`): the peak pill on the large ribbon.
- **Peak chip glow** (`box-shadow: 0 1px 3px 0 color-mix(in oklab, var(--peak) 30%, transparent), 0 1px 2px -1px color-mix(in oklab, var(--peak) 30%, transparent)`): the gold status chip.
- **Photo** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): full-size photos on the bottle page.

### Named Rules
**The Ring Not Shadow Rule.** Cards and fields separate from the ground with a 1px hairline ring (line at about 70%), never a drop shadow.

## Shapes

Soft, friendly corners that grow with the size of the thing: 8px for small photo tiles and the segment thumb, 10px for the segment track, 12px for fields and the Tonight photo tile, 16px for detail cards, buttons, banners and full photos, 24px for the Tonight card and the top of bottom sheets. Everything that is a toggle, a tag, a status or the scan button is a full pill. Ribbons are full-radius bars; the peak segment is a taller pill laid over the bar, which is the system's one signature silhouette. Clean product photos are scaled to 118% inside their tile so the bottle fills the portrait crop.

## Components

### Buttons
Ink-filled, quiet, and large.
- **Shape:** gently rounded (16px) for paired action buttons, full pills for single standalone actions.
- **Primary:** ink fill, surface-coloured label, 600 weight, 12px vertical padding, sharing the row 50/50 with its secondary ("Open a bottle" / "Rate").
- **Secondary:** surface fill, ink label, 1px hairline ring.
- **Pill:** 44px tall, 20px side padding; ink fill ("Scan a bottle") or well fill ("Clear search and filters").
- **States:** pressed darkens to the next well/line step or drops opacity to 80%; disabled at 50% opacity. There is no hover styling; this is a touch product.

### Chips
- **Filter chips:** 36px pills with a 44pt hit area (the `hit` utility in src/index.css extends the tap area invisibly), label type, well fill with second-ink text; the active chip fills with ink and takes the ground colour for its text. The sort control is a chip with a chevron over a transparent native select.
- **Status chips (bottle page):** pills in the stage family: the stage colour at 20-25% over the surface with the stage text tone. Peak is the exception: a solid gold gradient with dark `on-peak` text, semibold, and the peak chip glow.
- **Tags:** well-filled pills, callout type, soft ink (tasting notes, food pairings).

### Cards / Containers
- **Detail card:** surface fill, 16px radius, 16px padding, 1px hairline ring, title-small heading. Label/value rows inside are separated by hairlines at 60%.
- **Open tonight card:** 24px radius, 16px padding, tinted by the bottle's own stage (stage colour at 12-14% fill, 1px ring at 30-40%). Contents: the wine name in headline-small, the meta line, a one-sentence reason with the deadline in bold, a 64x88 photo tile on the right, and the large ribbon below.
- **Bottom sheet:** surface fill, 24px top corners, a 40x6px hairline grabber, over a 40% ink scrim.

### Inputs / Fields
- **Search field:** a 40px well with a 12px radius, magnifier in third ink, placeholder in third ink; the whole well takes a 2px focus ring.
- **Form field:** surface fill, 12px radius, 10px by 12px padding, 1px hairline ring that becomes a 2px focus ring; label above in meta type, second ink.
- **Segment:** a well track (10px radius, 2px inset) with the selected half on the surface with the segment-thumb shadow.

### Navigation
- **Tab bar:** fixed, translucent ground with blur, a hairline top edge. Two tabs (Cellar glass icon, Wishlist heart icon), 24px line icons at 1.8 stroke with axis-type labels; active is ink, inactive third ink. The centre holds the 56px ink scan button raised 28px above the bar, and an underlined "Manually" text link under it. Shown only on the two list screens.
- **Page header:** sticky, 48px, translucent ground with blur; a "Back" chevron button on the left, a text action ("Edit") on the right.
- **Icons:** hand-drawn inline SVG line icons, round caps and joins, current colour.

### Drinking-window Ribbon (signature)
A bottle's whole life on a year axis: hold, ready, peak, ready, past, as colour bands with short blends (at most 3.5% of the bar) at each change. The peak is a taller full-radius pill over the bar with a light-gold to gold to light-gold gradient.
- **Row size:** 6px bar, 10px peak, no halo, inside the 112px track, with the shared now line.
- **Large size:** 14px bar, 22px peak with the peak halo, in a 24px-tall box with its own 2px now line; below it a tabular meta line with the first year, "Peak 2021–25" in the peak text tone (semibold, hidden when it would collide with Now), "Now" in bold ink, and the last year.

### Wine Row
The list's only row. Photo tile, name (row title, truncated) with an optional "×2" quantity, meta line, then the status line in its stage text tone. In the cellar the right column is the ribbon track; in the wishlist it is the typical price (15px semibold ink, ₪) and taste fit. The whole row is one link; pressing it fills it with well.

### Bottle Photo Tile
Portrait tile, 8px radius (12px in the Tonight card), clipped. Clean product photos (white squares) sit on white in both appearances; the owner's own photos sit on well. With no photo, a simple bottle drawing in the wine-type colour on a well tile.

## Do's and Don'ts

### Do:
- **Do** use the semantic colour names (`ground`, `surface`, `well`, `line`, `fg`, `fg2`, `fg3`, the stage names and their `t-*` text tones) in new code, and define any new colour as a custom property with a light and a dark value.
- **Do** put every year, count and price in tabular lining figures.
- **Do** draw a bottle's drinking status as a ribbon on a shared axis with one now line when bottles are compared; text status lines use the stage text tone.
- **Do** keep rows inset 16px with dividers on the content edges, and keep the ribbon track at 112px in every row and section header so the now line stays continuous.
- **Do** keep clean bottle photos on white tiles in both appearances.
- **Do** give every tappable control a 44pt hit area, padding invisible hit area around small marks.
- **Do** keep motion to press feedback (scale 95% on the scan button, opacity or well fill on rows and cards) and disclosure rotation, all disabled under `prefers-reduced-motion`.

### Don't:
- **Don't** introduce an accent or brand colour, or tint a button with anything but ink.
- **Don't** use gold for anything other than the peak stage and the owner's star fills.
- **Don't** use the legacy `wine-*`, `cream-*`, `ink-*` or `white` names in new code; they are aliases kept for older screens.
- **Don't** fall back to a stacked card feed with status pills for the bottle list; the list is rows on a chart.
- **Don't** add a second typeface, uppercase eyebrows or letter-spaced labels.
- **Don't** add drop shadows to cards or fields; separate them with tone and a hairline ring.
- **Don't** add year labels to the left of Now on row axes, or authored entrance animation on load; both were left out deliberately.
