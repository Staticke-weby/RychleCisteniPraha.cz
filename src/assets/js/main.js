/* Rychlé čištění Praha – main.js (bez závislostí) */
(function () {
  "use strict";

  /* ---------- Mobilní navigace ---------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");
  var header = document.querySelector("[data-header]");

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.querySelector(".visually-hidden").textContent = "Otevřít menu";
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.querySelector(".visually-hidden").textContent = open ? "Zavřít menu" : "Otevřít menu";
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      closeNav();
    });
  }

  /* ---------- Stín hlavičky při scrollu ---------- */
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Lightbox ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox-item]"));
  if (!items.length) return;

  var box = document.querySelector("[data-lightbox]");
  if (!box) return;

  var imgEl = box.querySelector("[data-lightbox-img]");
  var capEl = box.querySelector("[data-lightbox-caption]");
  var btnClose = box.querySelector("[data-lightbox-close]");
  var btnPrev = box.querySelector("[data-lightbox-prev]");
  var btnNext = box.querySelector("[data-lightbox-next]");
  var current = 0;
  var lastFocus = null;

  function render(index) {
    current = (index + items.length) % items.length;
    var link = items[current];
    imgEl.src = link.getAttribute("href");
    imgEl.alt = link.getAttribute("data-caption") || "";
    capEl.textContent = link.getAttribute("data-caption") || "";
  }

  function open(index) {
    lastFocus = document.activeElement;
    render(index);
    box.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose.focus();
  }

  function close() {
    box.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  items.forEach(function (link, index) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      open(index);
    });
  });

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", function () { render(current - 1); });
  btnNext.addEventListener("click", function () { render(current + 1); });

  box.addEventListener("click", function (e) {
    if (e.target === box) close();
  });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") render(current - 1);
    else if (e.key === "ArrowRight") render(current + 1);
    else if (e.key === "Tab") {
      var focusables = [btnPrev, btnNext, btnClose].filter(function (b) { return b && !b.disabled; });
      var idx = focusables.indexOf(document.activeElement);
      if (idx === -1) idx = 0;
      var next = e.shiftKey
        ? (idx - 1 + focusables.length) % focusables.length
        : (idx + 1) % focusables.length;
      e.preventDefault();
      focusables[next].focus();
    }
  });
})();
