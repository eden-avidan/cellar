# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

A mobile-first PWA, used almost entirely from the owner's iPhone Home Screen (standalone, portrait), occasionally in a desktop browser.

## Users

One person: the owner, a wine drinker in Israel building a personal collection (about 16 bottles and growing). Single account, Google sign-in; no sharing.

## Product Purpose

Cellar keeps track of the bottles the owner has, wants, and has finished, and answers the question that matters at the moment of use: which bottle to open now. Success is opening the right bottle at the right time and remembering how each one was.

## Positioning

Cellar reads the bottle for you. One photo of the label becomes a full record: label facts, style, serving advice, drinking window, peak, expiry and a typical Israeli price, read by Claude. The owner then sees, for every bottle, whether it is waiting, ready, at its peak or past it.

## Operating Context

The main moments, in the owner's words:
- **Choosing what to open**: at home, deciding what's ready, at its peak, or right for tonight's food.
- **Adding bottles**: photographing a new bottle right after buying it (camera or photo library; manual entry as a fallback; re-adding a wine already recorded).
- **Rating after tasting**: logging a 1-5 rating and notes, often when opening a bottle.

Used in the evening and in daylight; the app follows the phone's light/dark appearance. Hebrew-language labels are common (Israeli wines); the interface is English, prices are in shekels.

## Capabilities and Constraints

- Lists: Cellar (with Finished) and Wishlist; search, type filter, "Ready to drink", sort (newest, drink soonest, top rated, vintage, taste fit). View choices persist per list.
- Bottle record: label facts (producer, name, vintage, country with flag, region, appellation, classification, type, grapes with optional %, alcohol, size); estimates (body, sweetness, acidity, tannin, tasting notes, food-pairing categories, serving temperature, decanting, drinking window, peak, expiry, typical price); the owner's details (bottles, storage spot, price paid, shop, purchase date, notes); tastings; photos (a clean product photo first, the owner's own photo after it); the original scan answer.
- Drinking status vocabulary: Hold · Ready · At its peak · Drink soon / this year · Past its best / prime.
- Actions: scan (camera / library), add manually, from my wines, open a bottle (logs a tasting, decrements bottles, last one moves to Finished), rate, edit, reset to scanned values, bought it (wishlist → cellar).
- Stack: React + TypeScript + Tailwind 4 + Vite PWA, Firebase (Auth, Firestore with offline cache, Storage, Functions). Works offline for viewing and editing; scanning and photo upload need a connection.
- Cost constraint: the label reader runs on the owner's Anthropic API key (about 3¢ a scan); no other feature may spend it without the owner asking.

## Brand Commitments

Name: **Cellar**. No other binding brand assets. The owner explicitly does not want it to feel like a generic app.

## Evidence on Hand

The owner's real collection (16 bottles) in Firestore, each with a standardized 1080×1080 white-background product photo and the owner's own label photo. No testimonials, users, or metrics exist and none are to be invented.

## Product Principles

1. **The bottle decides.** Every screen helps answer "what should I open, and when?"; drinking status is the primary signal.
2. **Read, then trust but verify.** The scan does the typing; everything stays editable, and estimates are clearly estimates.
3. **One person's cellar.** Personal, not social: no feeds, no scores from others, no gamification.
4. **Cheap and private.** No feature spends the API key unasked; data stays in the owner's account.

## Accessibility & Inclusion

Follows the phone's light/dark setting; iPhone touch targets (44 pt minimum); readable in dim evening light. Mixed Hebrew/English proper names must render correctly.
