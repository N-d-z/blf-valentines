/**
 * BLF Valentine's Gala — waitlist sign-ups and partner enquiries.
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet.
 * Setup steps are in SETUP.md next to this file.
 */

// 1. Your email. You get a short notification for every sign-up and enquiry.
const NOTIFY_EMAIL = 'you@example.com';

// 2. Send each guest a "you're on the waitlist" email? (true or false)
const SEND_CONFIRMATION = true;

// 3. Shown as the sender name on emails from this script.
const SENDER_NAME = "BLF Valentine's Gala";

const EVENT = {
  name: "Love, Faith & Real Life: The Valentine's Gala",
  date: 'Sunday, 14 February 2027',
  time: '4:00 PM',
  venue: 'Golden Tulip La Kings, Port Harcourt',
  dress: 'Black Tie & Velvet Glamour',
  site: 'https://blf-valentines.vercel.app'
};

const WAITLIST_SHEET = 'Waitlist';
const PARTNER_SHEET = 'Partner enquiries';
const WAITLIST_HEADERS = ['Submitted', 'Name', 'Email', 'Phone / WhatsApp', 'Attending as', "Partner's name", 'Dietary / table notes', 'Consent', 'Status'];
const PARTNER_HEADERS = ['Submitted', 'Name', 'Organisation', 'Email', 'Phone / WhatsApp', 'How they would like to partner', 'Status'];
const TYPES = ['Single', 'Married Couple', 'Engaged'];

/* ---------- Web app entry points ---------- */

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = parse_(e);
    if (d.company) return json_({ ok: true }); // spam trap filled in: ignore quietly
    if (d.formType === 'partner') savePartner_(d);
    else saveWaitlist_(d);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('BLF sign-up form is connected and working.');
}

/** Run this once from the editor so Google asks for permission to use your Sheet and email. */
function authorize() {
  SpreadsheetApp.getActiveSpreadsheet();
  MailApp.getRemainingDailyQuota();
  sheet_(WAITLIST_SHEET, WAITLIST_HEADERS);
  sheet_(PARTNER_SHEET, PARTNER_HEADERS);
  console.log('All set. Emails left today: ' + MailApp.getRemainingDailyQuota());
}

/* ---------- Saving ---------- */

function saveWaitlist_(d) {
  const name = clean_(d.name, 120);
  const email = clean_(d.email, 160);
  const phone = clean_(d.phone, 40);
  const type = clean_(d.type, 30);
  if (name.length < 2 || !isEmail_(email) || phone.replace(/\D/g, '').length < 7 || TYPES.indexOf(type) === -1) {
    throw new Error('Missing or invalid fields');
  }
  const partner = type === 'Single' ? '' : clean_(d.partner, 120);
  const notes = clean_(d.notes, 1000);

  const sh = sheet_(WAITLIST_SHEET, WAITLIST_HEADERS);
  sh.appendRow([now_(), safe_(name), email, safe_(phone), type, safe_(partner), safe_(notes), d.consent === 'Yes' ? 'Yes' : 'No', 'Waitlisted']);
  const total = sh.getLastRow() - 1;

  if (SEND_CONFIRMATION && quota_() >= 1) sendGuestConfirmation_(name, email, type, partner);
  if (quota_() >= 1) {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'New waitlist sign-up: ' + name + ' (' + type + ')',
      name: SENDER_NAME,
      body: [
        'Name: ' + name,
        'Email: ' + email,
        'Phone / WhatsApp: ' + phone,
        'Attending as: ' + type + (partner ? ' with ' + partner : ''),
        notes ? 'Notes: ' + notes : null,
        '',
        'Sign-ups so far: ' + total,
        'Open the sheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
      ].filter(function (l) { return l !== null; }).join('\n')
    });
  }
}

function savePartner_(d) {
  const name = clean_(d.name, 120);
  const email = clean_(d.email, 160);
  const phone = clean_(d.phone, 40);
  if (name.length < 2 || !isEmail_(email) || phone.replace(/\D/g, '').length < 7) {
    throw new Error('Missing or invalid fields');
  }
  const org = clean_(d.organisation, 160);
  const message = clean_(d.message, 2000);

  sheet_(PARTNER_SHEET, PARTNER_HEADERS).appendRow([now_(), safe_(name), safe_(org), email, safe_(phone), safe_(message), 'New']);

  if (quota_() >= 1) {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'New partner enquiry: ' + name + (org ? ' (' + org + ')' : ''),
      name: SENDER_NAME,
      replyTo: email,
      body: [
        'Name: ' + name,
        'Organisation: ' + (org || '-'),
        'Email: ' + email,
        'Phone / WhatsApp: ' + phone,
        'Message: ' + (message || '-'),
        '',
        'Reply to this email to answer them directly.'
      ].join('\n')
    });
  }
  if (SEND_CONFIRMATION && quota_() >= 1) {
    MailApp.sendEmail({
      to: email,
      subject: "Thank you for your interest in partnering with BLF",
      name: SENDER_NAME,
      replyTo: NOTIFY_EMAIL,
      htmlBody: wrap_(
        '<p>Dear ' + esc_(first_(name)) + ',</p>' +
        '<p>Thank you for your interest in supporting <b>' + esc_(EVENT.name) + '</b> on ' + esc_(EVENT.date) + '. ' +
        'A member of the Body Life for Families team will be in touch soon.</p>' +
        '<p>With gratitude,<br>The BLF family</p>'
      )
    });
  }
}

function sendGuestConfirmation_(name, email, type, partner) {
  const pass = type === 'Single' ? 'a Singles Pass' : 'a Couples Pass' + (partner ? ' for you and ' + first_(partner) : '');
  MailApp.sendEmail({
    to: email,
    subject: "You're on the waitlist: BLF Valentine's Gala",
    name: SENDER_NAME,
    replyTo: NOTIFY_EMAIL,
    htmlBody: wrap_(
      '<p>Dear ' + esc_(first_(name)) + ',</p>' +
      '<p>Thank you for joining the waitlist for <b>' + esc_(EVENT.name) + '</b>. We\'ve noted your interest in ' + esc_(pass) + '.</p>' +
      '<table style="margin:18px 0;border-collapse:collapse;font-size:15px">' +
        row_('When', EVENT.date + ', ' + EVENT.time) +
        row_('Where', EVENT.venue) +
        row_('Dress code', EVENT.dress) +
      '</table>' +
      '<p style="margin-bottom:6px"><b>What happens next</b></p>' +
      '<ol style="margin-top:0;padding-left:20px;line-height:1.6">' +
        '<li>We\'ll send early-bird prices and your payment link by email and WhatsApp.</li>' +
        '<li>Payment confirms your booking. Seats are allocated after payment, subject to availability.</li>' +
        '<li>Your confirmation and event instructions follow after payment.</li>' +
      '</ol>' +
      '<p>Joining the waitlist is free and does not reserve a seat yet.</p>' +
      '<p>With love,<br>The BLF family</p>'
    )
  });
}

/* ---------- Helpers ---------- */

function parse_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (err) { /* fall through to form fields */ }
  }
  return (e && e.parameter) || {};
}

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F3E9DA');
    sh.setFrozenRows(1);
  }
  return sh;
}

function clean_(v, max) { return String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max); }
// Stop a value like "=SUM(...)" being run as a spreadsheet formula
function safe_(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; }
function isEmail_(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
function first_(v) { return String(v).split(/\s+/)[0]; }
function esc_(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function now_() { return Utilities.formatDate(new Date(), 'Africa/Lagos', 'yyyy-MM-dd HH:mm'); }
function quota_() { return MailApp.getRemainingDailyQuota(); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function row_(k, v) {
  return '<tr><td style="padding:4px 16px 4px 0;color:#7a6a63">' + esc_(k) + '</td><td style="padding:4px 0;color:#30231F"><b>' + esc_(v) + '</b></td></tr>';
}
function wrap_(inner) {
  return '<div style="font-family:Georgia,serif;background:#F7F1E8;padding:28px 16px">' +
    '<div style="max-width:560px;margin:0 auto;background:#FBF7F1;border:1px solid #D6B77A;border-radius:14px;overflow:hidden">' +
      '<div style="background:#641E32;color:#EBD7AC;padding:18px 24px;font-size:20px;font-style:italic">BLF Valentine\'s Gala 2027</div>' +
      '<div style="padding:22px 24px;color:#30231F;font-size:16px;line-height:1.6">' + inner + '</div>' +
      '<div style="padding:14px 24px;border-top:1px solid #EFE6D8;font-size:13px;color:#7a6a63">' +
        '<a href="' + EVENT.site + '" style="color:#641E32">' + EVENT.site.replace('https://', '') + '</a></div>' +
    '</div></div>';
}
