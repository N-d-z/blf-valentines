# BLF Valentine's Special — landing & waitlist page

A plain static website. No build step, no CDNs: fonts and icons are bundled, so it looks the same everywhere (and works offline).

```
index.html            the page
assets/css/style.css  all styling
assets/js/config.js   ← the only file you normally edit
assets/js/main.js     countdown, menu, pass toggle, form
assets/fonts/         self-hosted fonts
submit.php            optional sign-up saver for cPanel/PHP hosts
data/                 where submit.php saves waitlist.csv (blocked from public)
```

## Preview locally
Double-click `index.html`. Everything works except sending sign-ups anywhere (they're kept in your own browser in demo mode).

## Settings — `assets/js/config.js`
- `eventStart` — gala start time for the countdown (currently 5:00 PM Lagos time, 14 Feb 2027).
- `formEndpoint` — where sign-ups go. Empty = demo mode.
- `socials` — paste your Instagram / Facebook / YouTube / WhatsApp links. Empty ones are hidden.

## Host on cPanel
1. cPanel → File Manager → `public_html` (or a subfolder, e.g. `public_html/valentines`).
2. Upload the zip, right-click → Extract. The files extract straight into that folder, so `index.html` ends up at its top level.
3. To collect sign-ups on your own server: set `formEndpoint: "submit.php"` in `config.js`.
   Sign-ups appear in `data/waitlist.csv` — download it from File Manager and open in Excel/Google Sheets.
   The `data` folder is blocked from the public web by its `.htaccess` file.

## Host on Vercel
1. Push this folder to a GitHub repository, then on vercel.com → Add New → Project → import that repository.
2. Framework preset: **Other**. No build command, no output directory.
3. Vercel doesn't run PHP, so use one of these for sign-ups:
   - **Formspree** (easiest): create a form at formspree.io, copy its URL into `formEndpoint`. Sign-ups arrive by email and in their dashboard.
   - **Google Sheets**: in a Sheet, Extensions → Apps Script, paste a `doPost(e)` that appends `e.parameter` values as a row, Deploy → Web app (access: Anyone), paste the `/exec` URL into `formEndpoint`.

## Fields sent with each sign-up
`name, email, phone, type (Single | Married Couple | Engaged), partner, notes, submittedAt`
