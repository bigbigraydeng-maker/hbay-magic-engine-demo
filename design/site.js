(function () {
  document.querySelectorAll(".nav-toggle").forEach(function (toggle) {
    var nav = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  });
})();

/* Slider: scroll-snap track with arrows, dots and a gentle autoplay that stops on interaction. */
(function () {
  document.querySelectorAll("[data-slider]").forEach(function (root) {
    var track = root.querySelector(".slides");
    var slides = root.querySelectorAll(".slide");
    var dots = root.querySelectorAll(".slider-dots button");
    var prev = root.querySelector(".prev");
    var next = root.querySelector(".next");
    var index = 0;
    var timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[index].offsetLeft, behavior: reduce ? "auto" : "smooth" });
      mark();
    }
    function mark() {
      dots.forEach(function (d, i) { d.setAttribute("aria-selected", String(i === index)); });
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { if (!reduce && !timer) timer = setInterval(function () { go(index + 1); }, 6500); }

    track.addEventListener("scroll", function () {
      var w = track.clientWidth || 1;
      var i = Math.round(track.scrollLeft / w);
      if (i !== index) { index = i; mark(); }
    }, { passive: true });
    prev.addEventListener("click", function () { stop(); go(index - 1); });
    next.addEventListener("click", function () { stop(); go(index + 1); });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { stop(); go(i); }); });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("focusin", stop);
    root.addEventListener("touchstart", stop, { passive: true });
    root.addEventListener("mouseleave", start);
    start();
  });
})();
