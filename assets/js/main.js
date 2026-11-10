(function () {
  "use strict";
  var cfg = window.BLF_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

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
  var target = new Date(cfg.eventStart || "2027-02-14T17:00:00+01:00").getTime();
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
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Pass toggle ---------- */
  var toggle = $("#tierToggle");
  var tiers = $$(".tier");
  var setTier = function (which) {
    toggle.setAttribute("data-active", which);
    $$("button", toggle).forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.tier === which)); });
    tiers.forEach(function (t) { t.classList.toggle("is-active", t.dataset.tier === which); });
  };
  $$("button", toggle).forEach(function (b) {
    b.addEventListener("click", function () { setTier(b.dataset.tier); });
    b.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        var next = b.dataset.tier === "single" ? "couple" : "single";
        setTier(next);
        $('[data-tier="' + next + '"]', toggle).focus();
      }
    });
  });
  // On wide screens, pointing at a card highlights it
  tiers.forEach(function (t) {
    t.addEventListener("mouseenter", function () { if (window.innerWidth >= 820) setTier(t.dataset.tier); });
  });

  /* ---------- Social links ---------- */
  var socials = cfg.socials || {};
  $$("[data-social]").forEach(function (a) {
    var url = socials[a.dataset.social];
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
    else { a.parentElement.style.display = "none"; }
  });

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
    r.addEventListener("change", function () {
      showPartner(r.value !== "Single");
      $('[data-field="type"]').classList.remove("has-error");
    });
  });

  // "Reserve" buttons on the pass cards preselect the attendance type
  $$("[data-reserve]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var r = $('input[name="type"][value="' + btn.dataset.reserve + '"]', form);
      if (r) { r.checked = true; r.dispatchEvent(new Event("change")); }
      setTimeout(function () { $("#f-name").focus({ preventScroll: true }); }, 650);
    });
  });

  ["name", "email", "phone"].forEach(function (n) {
    form.elements[n].addEventListener("input", function () {
      $('[data-field="' + n + '"]').classList.remove("has-error");
    });
  });

  var validate = function () {
    var ok = true;
    var v = function (n) { return form.elements[n].value.trim(); };
    var fail = function (n) { $('[data-field="' + n + '"]').classList.add("has-error"); ok = false; };
    if (v("name").length < 2) fail("name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) fail("email");
    if (v("phone").replace(/\D/g, "").length < 7) fail("phone");
    if (!$('input[name="type"]:checked', form)) fail("type");
    return ok;
  };

  var setLoading = function (on) {
    submitBtn.disabled = on;
    submitLabel.innerHTML = on
      ? '<span style="display:inline-flex;align-items:center;gap:.6rem"><span class="spinner"></span>Saving your seat</span>'
      : "Join the Priority List";
  };

  var send = function (data) {
    var endpoint = (cfg.formEndpoint || "").trim();
    if (!endpoint) {
      // Demo mode: keep a copy in this browser only
      try {
        var list = JSON.parse(localStorage.getItem("blf_waitlist") || "[]");
        list.push(data);
        localStorage.setItem("blf_waitlist", JSON.stringify(list));
      } catch (e) { /* storage unavailable, still show success */ }
      return new Promise(function (res) { setTimeout(res, 900); });
    }
    var fd = new FormData();
    Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
    var isGoogle = endpoint.indexOf("script.google.com") !== -1;
    return fetch(endpoint, {
      method: "POST",
      body: fd,
      mode: isGoogle ? "no-cors" : "cors",
      headers: isGoogle ? undefined : { Accept: "application/json" }
    }).then(function (r) {
      if (!isGoogle && !r.ok) throw new Error("Server responded " + r.status);
    });
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    alertBox.classList.remove("is-shown");
    if (!validate()) {
      var first = $(".has-error", form);
      if (first) {
        first.scrollIntoView({ behavior: "smooth", block: "center" });
        var inp = $("input, textarea", first); if (inp) inp.focus({ preventScroll: true });
      }
      return;
    }
    if (form.elements.company.value) return; // bot

    var type = $('input[name="type"]:checked', form).value;
    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      type: type,
      partner: type === "Single" ? "" : form.elements.partner.value.trim(),
      notes: form.elements.notes.value.trim(),
      submittedAt: new Date().toISOString()
    };

    setLoading(true);
    send(data).then(function () {
      var first = data.name.split(/\s+/)[0];
      var what = type === "Single"
        ? "a Singles Pass"
        : "a Couples Pass" + (data.partner ? " for you and " + data.partner.split(/\s+/)[0] : "");
      $("#successMsg").textContent = "Thank you, " + first + ". We've noted your interest in " + what +
        ". Early-bird pricing and the full programme will reach you at " + data.email + " and on WhatsApp before public release.";
      form.style.display = "none";
      success.classList.add("is-shown");
      success.focus({ preventScroll: true });
      $("#formCard").scrollIntoView({ behavior: "smooth", block: "center" });
      hearts();
    }).catch(function () {
      alertBox.textContent = "Your details didn't send. Check your connection and try again.";
      alertBox.classList.add("is-shown");
    }).then(function () { setLoading(false); });
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
})();
