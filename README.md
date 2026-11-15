# BLFF Valentine's Special — landing & waitlist page

Live at https://blff-valentines.vercel.app. Every push to `main` redeploys it on Vercel.

A plain static website: fonts, icons and photos are bundled, nothing loads from other sites.

```
index.html               the page (built from _src/index.src.html, see below)
assets/css/style.css     all styling
assets/js/config.js      ← settings: countdown time, form destination, social links
assets/js/main.js        countdown, menu, forms
assets/img/photos/       event photos (cropped and compressed)
assets/fonts/            self-hosted fonts
google-apps-script/      Google Sheet script + SETUP.md for collecting sign-ups
_src/                    page source with {{i:icon}} placeholders, icons, build script
submit.php, data/        optional sign-up saver if hosted on cPanel/PHP instead
```

## Editing the page
Edit `_src/index.src.html`, then run `python3 _src/build.py` to regenerate `index.html`
(it inlines the icons from `_src/icons`). Small text fixes can also be made directly in `index.html`.

## Settings — `assets/js/config.js`
- `eventStart` — start time for the countdown (4:00 PM Lagos time, 14 Feb 2027).
- `formEndpoint` — where sign-ups and partner enquiries go. Empty = demo mode (nothing is saved centrally).
  Use the Google Sheet web app URL from `google-apps-script/SETUP.md`.
- `socials` — Instagram / Facebook / YouTube / WhatsApp links. Empty ones are hidden.

## Data sent by the forms
Waitlist: `formType=waitlist, name, email, phone, type (Single | Married Couple | Engaged), partner, notes, consent, submittedAt`
Partner enquiry: `formType=partner, name, organisation, email, phone, message, submittedAt`

## Hosting elsewhere
- **cPanel**: upload the folder to `public_html`. To save sign-ups on the server instead of Google Sheets,
  set `formEndpoint: "submit.php"`; they land in `data/waitlist.csv` (blocked from public access).
