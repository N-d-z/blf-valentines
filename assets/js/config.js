/* =========================================================
   Site settings — edit these, no other file needs changing.
   ========================================================= */
window.BLF_CONFIG = {
  // When the gala starts (Lagos time, UTC+01:00). Drives the countdown.
  eventStart: "2027-02-14T16:00:00+01:00",

  // Where waitlist sign-ups and partner enquiries are sent.
  // Leave empty ("") to run in demo mode: the forms work and show their
  // success messages, but nothing is saved anywhere except the visitor's own browser.
  //
  // Recommended: the Google Sheet web app URL from google-apps-script/SETUP.md
  //   e.g. "https://script.google.com/macros/s/XXXX/exec"
  // Other options: a Formspree URL, or "submit.php" on a cPanel/PHP host.
  formEndpoint: "https://script.google.com/macros/s/AKfycbyl_t5puQ6gE4hX5m3KZ93lJqgKdqN5qvm4XAYKsj98poCR5dLjxnHTiWTDN-WzMrak/exec",

  // Social links for the footer. Leave "" to hide a link.
  socials: {
    instagram: "",
    facebook: "",
    youtube: "",
    whatsapp: ""
  }
};
