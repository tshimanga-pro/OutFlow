# Smart Wallet — a simple personal expense tracker

A single-page app for logging expenses, setting monthly budgets per
category, and seeing an alert when you're near or over a limit.
Works on desktop and mobile, installs as a PWA, and stores all data
locally on-device (IndexedDB via Dexie.js). No backend, no account.

## Run it

You can't just double-click `index.html` (the service worker needs a
real origin), so serve the folder locally:

```bash
cd expense-tracker
python3 -m http.server 8000
# then open http://localhost:8000
```

or with Node:

```bash
npx serve .
```

## Deploy it

Any static host works, since this is plain HTML/CSS/JS:

- **GitHub Pages** — push the folder to a repo, enable Pages
- **Netlify / Vercel** — drag-and-drop the folder or connect the repo
- **Cloudflare Pages** — same idea

Once it's on `https://`, open it on your phone and use
"Add to Home Screen" (iOS Safari) or the install prompt (Android
Chrome / desktop Chrome) to make it feel like a native app.

## How it's built

| File | Purpose |
|---|---|
| `index.html` | Page structure: log form, ledger list, budgets tab, summary tab |
| `style.css` | All styling — a ledger-book visual language, no framework |
| `app.js` | Dexie schema, CRUD, budget math, rendering |
| `manifest.json` | Makes it installable as a PWA |
| `sw.js` | Caches the app shell so it works offline |
| `icon.svg` | App icon |

### Data model

```js
expenses: { id, date, amount, category, note, created_at }
budgets:  { category, limit_amount }   // one row per category, monthly
```

Budgets are always monthly. `db.expenses.where('date').startsWith(monthKey)`
pulls everything for the month currently in view.

### Alert logic

For each category with a budget set:
- **spent < 80% of limit** → green (ok)
- **80–100%** → amber ("near limit")
- **> 100%** → red ("over limit")

This runs in `renderSummary()` in `app.js` — that's the one function
to edit if you want different thresholds.

## Things you'll likely want to change

- **Currency**: edit the `CURRENCY` constant at the top of `app.js`
  (currently `'UGX'`).
- **Categories**: edit the `CATEGORIES` array at the top of `app.js`.
  Categories are a fixed list on purpose — it's what makes budget
  matching simple. Add/remove freely; existing expenses keep whatever
  category string they were saved with.
- **Push notifications** when a budget is exceeded: hook into the
  Notifications API inside `onAddExpense`, after the expense is
  saved — check that category's new total against its budget and
  fire a notification if it just crossed the line.
- **Cross-device sync**: swap Dexie's local IndexedDB calls for a
  Supabase client (Postgres + auth, free tier). The data model above
  maps directly to two tables. This is the natural next step once you
  want the same data on your phone and laptop.
- **Charts**: if you want spend-over-time rather than just
  month-by-month totals, add Chart.js and feed it `db.expenses`
  grouped by date.

## Browser support

Uses IndexedDB (via Dexie), the Web App Manifest, and Service
Workers — all supported in current Safari, Chrome, Firefox, and Edge,
on both desktop and mobile.
