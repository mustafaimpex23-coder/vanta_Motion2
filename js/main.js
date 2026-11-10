/* ==========================================================================
   Vanta Motions — shared script
   1. Mobile navigation (hamburger)
   2. Header style on scroll
   3. Fade-in on scroll (respects reduced-motion)
   4. Footer year
   5. Contact form validation (front-end only, no backend)
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- 1. Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");

  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close the menu when a link is chosen
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setNav(false); });
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setNav(false);
        toggle.focus();
      }
    });

    // Reset when resizing up to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setNav(false);
    });
  }

  /* ---------- 2. Header border once the page scrolls ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Gentle fade-in on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    // Show everything immediately
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 4. Current year in the footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- 5. Contact form (front-end validation only) ---------- */
  var form = document.getElementById("contact-form");
  if (!form) return;

  var success = document.getElementById("form-success");

  // Each rule returns an error message, or "" when the value is valid
  var rules = {
    name: function (v) {
      if (!v) return "Please enter your name.";
      if (v.length < 2) return "Your name looks a little short.";
      return "";
    },
    email: function (v) {
      if (!v) return "Please enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Please enter a valid email, e.g. name@example.com.";
      return "";
    },
    phone: function (v) {
      if (!v) return "Please enter your phone number.";
      var digits = v.replace(/\D/g, "");
      if (!/^[+\d\s()-]+$/.test(v) || digits.length < 7 || digits.length > 15) {
        return "Please enter a valid phone number, e.g. +92 300 1234567.";
      }
      return "";
    },
    service: function (v) {
      return v ? "" : "Please choose a service.";
    },
    message: function (v) {
      if (!v) return "Please tell us a little about your project.";
      if (v.length < 10) return "Please write at least 10 characters.";
      return "";
    }
  };

  function validateField(input) {
    var rule = rules[input.name];
    if (!rule) return true;
    var msg = rule(input.value.trim());
    var field = input.closest(".field");
    var errorEl = document.getElementById(input.id + "-error");

    field.classList.toggle("has-error", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (errorEl) errorEl.textContent = msg;
    return !msg;
  }

  // Re-check a field as the user corrects it (only once it has shown an error)
  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    if (!input) return;
    var evt = input.tagName === "SELECT" ? "change" : "input";
    input.addEventListener(evt, function () {
      if (input.closest(".field").classList.contains("has-error")) validateField(input);
    });
    input.addEventListener("blur", function () {
      if (input.value.trim()) validateField(input);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (success) success.classList.remove("is-visible");

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (input && !validateField(input) && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // No backend: show the success message and clear the form
    var firstName = form.elements.name.value.trim().split(" ")[0];
    var nameSlot = document.getElementById("success-name");
    if (nameSlot) nameSlot.textContent = firstName;

    form.reset();
    form.querySelectorAll(".field").forEach(function (f) { f.classList.remove("has-error"); });
    if (success) {
      success.classList.add("is-visible");
      success.focus();
    }
  });
})();
