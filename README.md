# Cellar 🍷

A personal wine cellar and wishlist for iPhone, built as a web app you add to the Home Screen.
Take a photo of a bottle, and Claude reads the label and fills in the details. Edit anything, rate
each bottle after you taste it, and keep a wishlist of bottles to buy.

- **web/**: React + TypeScript + Tailwind PWA (Vite).
- **functions/**: one Firebase Cloud Function, `analyzeLabel`. It holds the Anthropic API key and
  sends the photos to Claude with a JSON schema (structured outputs), so the answer always parses.
- **Firestore** stores wines under `users/{uid}/wines/{id}`. **Cloud Storage** stores photos under
  `users/{uid}/wines/{id}/`. The rules let only the owner read or write.

## What each bottle holds

| Group | Fields | Source |
|---|---|---|
| Label | producer, name, vintage, type, country, region, appellation, classification, grapes, alcohol, bottle size | Read from the label; null when unreadable |
| When to drink | best time to open (from/to year + note), expires at (year, from the label or estimated) | Claude's estimate |
| Style & serving | body, sweetness, acidity, tannin, tasting notes, food pairings, serving temp, decanting, typical price (₪) | Claude's estimate |
| Taste fit | 1–5 score + reason, based on the wines you've already rated | Claude, once you have ratings |
| Yours (all optional) | bottles, storage spot, price paid, shop, purchase date, notes | You |
| Tastings | date, 1–5 stars, notes; "Open a bottle" also takes one out of the cellar | You |

Lists: **Cellar** (with a **Finished** tab, which the last opened bottle moves to) and **Wishlist**
(with a "Bought it → cellar" button).

## Model choice

`claude-opus-5-5` at effort `low`: Anthropic's current default model, strong at reading photos and at
knowing specific wines, with low effort to keep scans quick. Change either one without touching code
by setting `CLAUDE_MODEL` / `CLAUDE_EFFORT` in `functions/.env.<project-id>` and redeploying. For
example, `claude-sonnet-5-5` costs about half as much per scan. Requests also opt into server-side
refusal fallbacks (`fallbacks: "default"`), so a rare false-positive safety decline is retried on
another model instead of failing.

Rough cost estimate (not measured): about 5,000 input + 1,500 output tokens per scan with two
photos, roughly **$0.05 per scan** on Opus 5.5.

## Run locally (no API key needed)

```bash
npm install
npm run emulators          # auth, firestore, storage, functions on the emulators
npm run dev                # http://localhost:5173
```

`functions/.env.local` sets `AI_MOCK=true`, so the emulator returns a canned "Demo Winery" answer
instead of calling Claude. To test the real model locally, remove that line and put
`ANTHROPIC_API_KEY=...` in `functions/.secret.local`, which git ignores.

The emulators need Java (`JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-27.jdk/Contents/Home`).

## Deploy (one time)

1. **Firebase project**: at console.firebase.google.com, create a project and switch it to the
   **Blaze** plan, which Cloud Functions and Storage require. Under Billing, set a budget alert
   (for example $5). Personal use stays inside the free quota, so expect about $0 for Firebase
   itself.
2. In that project:
   - **Authentication** → Sign-in method → enable **Google**.
   - **Firestore** → create the database (`europe-west1`, or `me-west1` for Tel Aviv).
   - **Storage** → get started (same region).
   - **Project settings** → Your apps → add a **Web app**. Copy its config into
     `web/.env.production` (template: `web/.env.production.example`). Set
     `VITE_FB_AUTH_DOMAIN=<project-id>.web.app` so Google sign-in works from the Home Screen app.
3. **Anthropic key**: at console.anthropic.com, create an API key and add a few dollars of credit.
4. From this folder:
   ```bash
   firebase use --add                                    # pick the project
   firebase functions:secrets:set ANTHROPIC_API_KEY      # paste the key when asked
   ```
5. Create `functions/.env.<project-id>`:
   ```
   ALLOWED_EMAILS=you@gmail.com
   CLAUDE_MODEL=claude-opus-5-5
   CLAUDE_EFFORT=low
   ```
   `ALLOWED_EMAILS` is the list of Google accounts allowed to spend the API key. Without it, the
   function refuses every scan.
6. `npm run deploy`
7. On the iPhone, open `https://<project-id>.web.app` in **Safari** → Share → **Add to Home Screen**.
