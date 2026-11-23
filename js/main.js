/* ==========================================================================
   Vanta Motions — shared script (no libraries)
    1. Setup & feature checks
    2. Mobile navigation
    3. Header: scrolled style, hide on scroll down, scroll progress bar
    4. Word-by-word heading reveal
    5. Fade-in on scroll + number count-up
    6. Custom cursor            (mouse devices only)
    7. Magnetic buttons         (mouse devices only)
    8. Card spotlight + 3D tilt (mouse devices only)
    9. Hero spotlight + parallax
   10. Page transitions between pages
   11. Footer year
   12. Contact form validation (front-end only, no backend)
   All motion is skipped when the visitor prefers reduced motion.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- 1. Setup ---------- */
  var root = document.documentElement;
  function mq(q) { return window.matchMedia ? window.matchMedia(q).matches : false; }
  var reduceMotion = mq("(prefers-reduced-motion: reduce)");
  var finePointer = mq("(hover: hover) and (pointer: fine)");
  var introPlaying = root.classList.contains("intro");
  var INTRO_MS = 1500; // matches the loader timing in style.css

  /* ---------- 2. Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  var header = document.querySelector(".site-header");

  function navIsOpen() { return toggle && toggle.getAttribute("aria-expanded") === "true"; }

  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    if (open && header) header.classList.remove("is-hidden");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () { setNav(!navIsOpen()); });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setNav(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navIsOpen()) { setNav(false); toggle.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setNav(false);
    });
  }

  /* ---------- 3. Header behaviour + scroll progress ---------- */
  var progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty("--progress", max > 0 ? Math.min(y / max, 1) : 0);

    if (header) {
      header.classList.toggle("is-scrolled", y > 10);
      // Hide when scrolling down past the hero, show again when scrolling up
      var delta = y - lastY;
      if (y <= 300 || delta < -4) header.classList.remove("is-hidden");
      else if (delta > 4 && !navIsOpen()) header.classList.add("is-hidden");
    }
    if (Math.abs(y - lastY) > 4) lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Show the header if a keyboard user tabs into it while hidden
  if (header) header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });

  /* ---------- 4. Word-by-word heading reveal ---------- */
  // Wraps each word of a heading in two spans so CSS can slide words up.
  // Only headings that sit inside a .reveal block are split, so they always get revealed.
  function splitWords(el) {
    var i = 0;
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) { walk(n); return; }
        if (n.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var word = document.createElement("span");
          var inner = document.createElement("span");
          word.className = "word";
          word.setAttribute("aria-hidden", "true");
          inner.className = "word-inner";
          inner.style.setProperty("--i", i++);
          inner.textContent = part;
          word.appendChild(inner);
          frag.appendChild(word);
        });
        node.replaceChild(frag, n);
      });
    })(el);
    if (el.classList.contains("reveal")) el.classList.add("split-host");
  }

  if (!reduceMotion) {
    document.querySelectorAll("main h1, main h2").forEach(function (h) {
      if (h.closest(".reveal")) splitWords(h);
    });
  }

  /* ---------- 5. Fade-in on scroll + count-up ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  var counters = document.querySelectorAll("[data-count]");

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var start = null;
    var duration = 1800;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(2, -10 * t); // ease-out expo
      el.textContent = Math.round(target * (t === 1 ? 1 : eased));
      if (t < 1) requestAnimationFrame(step);
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.hasAttribute("data-count")) countUp(el);
        else el.classList.add("is-visible");
        observer.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    var startObserving = function () {
      revealEls.forEach(function (el) { observer.observe(el); });
      counters.forEach(function (el) { observer.observe(el); });
    };
    // Wait for the intro loader to lift before revealing the first screen
    if (introPlaying) setTimeout(startObserving, INTRO_MS); else startObserving();
  }

  /* ---------- 6. Custom cursor ---------- */
  if (finePointer && !reduceMotion) {
    var dot = document.createElement("div");
    var ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    dot.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = -100, my = -100, rx = -100, ry = -100, started = false;

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.translate = mx + "px " + my + "px";
      if (!started) { started = true; rx = mx; ry = my; root.classList.add("has-cursor"); }
      dot.classList.remove("is-out"); ring.classList.remove("is-out");
    });
    document.addEventListener("mouseleave", function () {
      dot.classList.add("is-out"); ring.classList.add("is-out");
    });

    (function follow() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.translate = rx + "px " + ry + "px";
      requestAnimationFrame(follow);
    })();

    document.addEventListener("mouseover", function (e) {
      var t = e.target;
      ring.classList.toggle("is-hover", !!t.closest("a, button, select, label, .spin-badge"));
      ring.classList.toggle("is-text", !!t.closest("input, textarea"));
    });
  }

  /* ---------- 7. Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn, .socials a, .spin-badge").forEach(function (el) {
      var strength = el.classList.contains("spin-badge") ? 0.2 : 0.3;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * strength;
        var y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
      });
      el.addEventListener("mouseleave", function () { el.style.translate = ""; });
    });
  }

  /* ---------- 8. Card spotlight + 3D tilt ---------- */
  if (finePointer) {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        if (reduceMotion) return;
        card.classList.add("is-tilting");
        card.style.transform = "perspective(900px) rotateX(" + ((0.5 - py) * 8).toFixed(2) +
          "deg) rotateY(" + ((px - 0.5) * 8).toFixed(2) + "deg) translateY(-6px)";
      });
      card.addEventListener("mouseleave", function () {
        card.classList.remove("is-tilting");
        card.style.transform = "";
      });
    });
  }

  /* ---------- 9. Hero spotlight + parallax ---------- */
  var hero = document.querySelector(".hero");
  var heroVisual = document.querySelector(".hero-visual");
  if (hero && finePointer) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      hero.style.setProperty("--mx", x + "px");
      hero.style.setProperty("--my", y + "px");
      if (heroVisual && !reduceMotion) {
        var dx = (x / r.width - 0.5) * -28;
        var dy = (y / r.height - 0.5) * -28;
        heroVisual.style.transform = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0)";
      }
    });
    hero.addEventListener("mouseleave", function () {
      if (heroVisual) heroVisual.style.transform = "";
    });
  }

  /* ---------- 10. Page transitions ---------- */
  if (!reduceMotion) {
    var curtain = document.createElement("div");
    curtain.className = "page-transition";
    curtain.setAttribute("aria-hidden", "true");
    document.body.appendChild(curtain);

    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      if (!/\.html(#.*)?$/i.test(a.getAttribute("href"))) return; // only our own pages
      if (a.pathname === location.pathname) return;                // same page: just scroll

      e.preventDefault();
      root.classList.add("is-leaving");
      setTimeout(function () { window.location.href = a.href; }, 450);
    });

    // Coming back with the browser's Back button: remove the curtain
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) root.classList.remove("is-leaving");
    });
  }

  /* ---------- 11. Current year in the footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- 12. Contact form (front-end validation only) ---------- */
  var form = document.getElementById("contact-form");
  if (!form) return;

  var success = document.getElementById("form-success");
  var submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    var spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
    submitBtn.appendChild(spinner);
  }

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

  function shake(field) {
    if (reduceMotion) return;
    field.classList.remove("shake");
    void field.offsetWidth; // restart the animation
    field.classList.add("shake");
  }

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
      if (input && !validateField(input)) {
        shake(input.closest(".field"));
        if (!firstInvalid) firstInvalid = input;
      }
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    // No backend: a short "sending" state, then the success message
    var firstName = form.elements.name.value.trim().split(" ")[0];
    if (submitBtn) submitBtn.classList.add("is-loading");

    setTimeout(function () {
      var nameSlot = document.getElementById("success-name");
      if (nameSlot) nameSlot.textContent = firstName;
      form.reset();
      form.querySelectorAll(".field").forEach(function (f) { f.classList.remove("has-error"); });
      if (submitBtn) submitBtn.classList.remove("is-loading");
      if (success) { success.classList.add("is-visible"); success.focus(); }
    }, reduceMotion ? 0 : 1100);
  });
})();
