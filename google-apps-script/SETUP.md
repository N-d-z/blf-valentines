# Connect the forms to a Google Sheet

About 10 minutes, once. After this, every waitlist sign-up and partner enquiry:
- lands as a row in your Google Sheet (tabs: **Waitlist** and **Partner enquiries**),
- emails you a short notification,
- sends the guest a "You're on the waitlist" email.

## 1. Create the Sheet
1. Signed in to your Google account, go to **sheets.new**.
2. Name it `BLF Valentine's Gala 2027 – Sign-ups`.

## 2. Add the script
1. In the Sheet: **Extensions → Apps Script**.
2. Delete everything in the editor and paste the whole of `Code.gs`.
3. On line 10, replace `you@example.com` with your email.
4. Click the save icon. Name the project `BLF sign-ups` if asked.

## 3. Give permission (once)
1. In the toolbar's function dropdown choose **authorize**, then click **Run**.
2. Click **Review permissions**, then choose your account.
3. Google shows "Google hasn't verified this app". That's normal for your own script:
   click **Advanced**, then **Go to BLF sign-ups (unsafe)**, then **Allow**.
4. Back in the Sheet, two tabs appear: **Waitlist** and **Partner enquiries**.

## 4. Publish it as a web app
1. **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Execute as: **Me**. Who has access: **Anyone**.
4. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. Paste that URL in a browser. You should see: *BLF sign-up form is connected and working.*

## 5. Connect the website
Put the URL in `assets/js/config.js`:

```js
formEndpoint: "https://script.google.com/macros/s/XXXXXXXX/exec",
```

## Good to know
- Emails are sent from the Google account that owns the Sheet, with the sender name "BLF Valentine's Gala".
  For a fully branded sender later, create a BLF Gmail account and repeat these steps from it.
- A free Gmail account can send about 100 emails a day from a script. Each sign-up uses two
  (your notification and the guest's confirmation), so roughly 50 sign-ups a day.
  If you expect more, set `SEND_CONFIRMATION = false` or remove your own notification.
- The **Status** column starts as "Waitlisted". Change it to "Paid" or "Seat confirmed" as you go, to track each guest.
- If you edit the script later: **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**.
  This keeps the same URL.
