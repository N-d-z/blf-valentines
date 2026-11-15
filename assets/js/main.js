(function () {
  "use strict";
  var cfg = window.BLF_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- Header shadow on scroll ---------- */
  var header = $("#header");
  var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 24); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var menuBtn = $("#menuBtn"), menu = $("#mobileMenu");
  var setMenu = function (open) {
    menu.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  };
  menuBtn.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
  $$("#mobileMenu a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* ---------- Countdown ---------- */
  var target = new Date(cfg.eventStart || "2027-02-14T16:00:00+01:00").getTime();
  var els = { d: $("#cdD"), h: $("#cdH"), m: $("#cdM"), s: $("#cdS") };
  var pad = function (n) { return n < 10 ? "0" + n : String(n); };
  var tick = function () {
    var t = Math.max(0, target - Date.now());
    var d = Math.floor(t / 864e5); t -= d * 864e5;
    var h = Math.floor(t / 36e5); t -= h * 36e5;
    var m = Math.floor(t / 6e4); t -= m * 6e4;
    var s = Math.floor(t / 1e3);
    els.d.textContent = d; els.h.textContent = pad(h); els.m.textContent = pad(m); els.s.textContent = pad(s);
  };
  tick();
  setInterval(tick, 1000);

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Social links (hidden until set in config.js) ---------- */
  var socials = cfg.socials || {};
  $$("[data-social]").forEach(function (a) {
    var url = socials[a.dataset.social];
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
    else { a.parentElement.style.display = "none"; }
  });

  /* ---------- Sending ---------- */
  // Google Apps Script receives JSON as plain text (no CORS preflight).
  // Formspree and PHP receive regular form fields.
  var send = function (data) {
    var endpoint = (cfg.formEndpoint || "").trim();
    if (!endpoint) {
      try {
        var list = JSON.parse(localStorage.getItem("blf_submissions") || "[]");
        list.push(data);
        localStorage.setItem("blf_submissions", JSON.stringify(list));
      } catch (e) { /* storage unavailable: still show success in demo mode */ }
      return new Promise(function (res) { setTimeout(res, 900); });
    }
    if (endpoint.indexOf("script.google.com") !== -1) {
      return fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      });
    }
    var fd = new FormData();
    Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
    return fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("Server responded " + r.status); });
  };

  var spinnerHTML = function (text) {
    return '<span style="display:inline-flex;align-items:center;gap:.6rem"><span class="spinner"></span>' + text + "</span>";
  };
  var setErr = function (key, bad) {
    var f = $('[data-field="' + key + '"]');
    if (f) f.classList.toggle("has-error", bad);
    return !bad;
  };
  var focusFirstError = function (scope) {
    var first = $(".has-error", scope);
    if (!first) return;
    first.scrollIntoView({ behavior: "smooth", block: "center" });
    var inp = $("input, textarea", first);
    if (inp) inp.focus({ preventScroll: true });
  };

  /* ---------- Waitlist form ---------- */
  var form = $("#waitlistForm");
  var partnerRow = $("#partnerRow");
  var partnerInput = $("#f-partner");
  var alertBox = $("#formAlert");
  var submitBtn = $("#submitBtn");
  var submitLabel = $("#submitLabel");
  var success = $("#success");

  var showPartner = function (show) {
    partnerRow.classList.toggle("is-shown", show);
    partnerInput.tabIndex = show ? 0 : -1;
  };
  $$('input[name="type"]', form).forEach(function (r) {
    r.addEventListener("change", function () { showPartner(r.value !== "Single"); setErr("type", false); });
  });
  form.elements.consent.addEventListener("change", function () { setErr("consent", false); });
  ["name", "email", "phone"].forEach(function (n) {
    form.elements[n].addEventListener("input", function () { setErr(n, false); });
  });

  // Pass buttons preselect the attendance type
  $$("[data-reserve]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var r = $('input[name="type"][value="' + btn.dataset.reserve + '"]', form);
      if (r) { r.checked = true; r.dispatchEvent(new Event("change")); }
      setTimeout(function () { $("#f-name").focus({ preventScroll: true }); }, 700);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    alertBox.classList.remove("is-shown");
    var v = function (n) { return form.elements[n].value.trim(); };
    var typeEl = $('input[name="type"]:checked', form);
    var ok = [
      setErr("name", v("name").length < 2),
      setErr("email", !EMAIL_RE.test(v("email"))),
      setErr("phone", v("phone").replace(/\D/g, "").length < 7),
      setErr("type", !typeEl),
      setErr("consent", !form.elements.consent.checked)
    ].every(Boolean);
    if (!ok) { focusFirstError(form); return; }
    if (form.elements.company.value) return; // spam trap

    var type = typeEl.value;
    var data = {
      formType: "waitlist",
      name: v("name"),
      email: v("email"),
      phone: v("phone"),
      type: type,
      partner: type === "Single" ? "" : v("partner"),
      notes: v("notes"),
      consent: "Yes",
      submittedAt: new Date().toISOString()
    };

    submitBtn.disabled = true;
    submitLabel.innerHTML = spinnerHTML("Saving your place");
    send(data).then(function () {
      var first = data.name.split(/\s+/)[0];
      var what = type === "Single"
        ? "a Singles Pass"
        : "a Couples Pass" + (data.partner ? " for you and " + data.partner.split(/\s+/)[0] : "");
      $("#successMsg").textContent = "Thank you, " + first + ". We've saved your interest in " + what +
        ". Look out for an email to " + data.email + " and a WhatsApp message from us.";
      form.style.display = "none";
      success.classList.add("is-shown");
      success.focus({ preventScroll: true });
      $("#formCard").scrollIntoView({ behavior: "smooth", block: "center" });
      hearts();
    }).catch(function () {
      alertBox.textContent = "Your details didn't send. Check your internet connection and try again.";
      alertBox.classList.add("is-shown");
    }).then(function () {
      submitBtn.disabled = false;
      submitLabel.textContent = "Join the Waitlist";
    });
  });

  $("#againBtn").addEventListener("click", function () {
    form.reset();
    showPartner(false);
    success.classList.remove("is-shown");
    form.style.display = "";
    $("#f-name").focus();
  });

  function hearts() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var card = $("#formCard");
    for (var i = 0; i < 14; i++) {
      var h = document.createElement("span");
      h.className = "heart-p";
      h.textContent = "♥";
      h.style.left = (12 + Math.random() * 76) + "%";
      h.style.fontSize = (12 + Math.random() * 16) + "px";
      h.style.color = Math.random() > 0.5 ? "#D6B77A" : "#641E32";
      h.style.animationDelay = (Math.random() * 0.7) + "s";
      card.appendChild(h);
      (function (el) { setTimeout(function () { el.remove(); }, 3500); })(h);
    }
  }

  /* ---------- Partner enquiry ---------- */
  var pToggle = $("#partnerToggle"), pForm = $("#partnerForm"), pSuccess = $("#pSuccess");
  var pAlert = $("#pAlert"), pSubmit = $("#pSubmit"), pLabel = $("#pLabel");
  pToggle.addEventListener("click", function () {
    var open = !pForm.classList.contains("is-shown");
    pForm.classList.toggle("is-shown", open);
    pToggle.setAttribute("aria-expanded", String(open));
    if (open) setTimeout(function () { $("#p-name").focus({ preventScroll: true }); }, 100);
  });
  [["name", "p-name"], ["email", "p-email"], ["phone", "p-phone"]].forEach(function (p) {
    pForm.elements[p[0]].addEventListener("input", function () { setErr(p[1], false); });
  });
  pForm.addEventListener("submit", function (e) {
    e.preventDefault();
    pAlert.classList.remove("is-shown");
    var v = function (n) { return pForm.elements[n].value.trim(); };
    var ok = [
      setErr("p-name", v("name").length < 2),
      setErr("p-email", !EMAIL_RE.test(v("email"))),
      setErr("p-phone", v("phone").replace(/\D/g, "").length < 7)
    ].every(Boolean);
    if (!ok) { focusFirstError(pForm); return; }
    var data = {
      formType: "partner",
      name: v("name"),
      organisation: v("organisation"),
      email: v("email"),
      phone: v("phone"),
      message: v("message"),
      submittedAt: new Date().toISOString()
    };
    pSubmit.disabled = true;
    pLabel.innerHTML = spinnerHTML("Sending");
    send(data).then(function () {
      pForm.classList.remove("is-shown");
      pToggle.style.display = "none";
      pSuccess.classList.add("is-shown");
    }).catch(function () {
      pAlert.textContent = "Your enquiry didn't send. Check your internet connection and try again.";
      pAlert.classList.add("is-shown");
    }).then(function () {
      pSubmit.disabled = false;
      pLabel.textContent = "Send Enquiry";
    });
  });
})();
