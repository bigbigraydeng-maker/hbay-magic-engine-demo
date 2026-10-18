(function () {
  document.querySelectorAll(".promise").forEach(function (button) {
    button.addEventListener("click", function () {
      var wasOpen = button.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".promise").forEach(function (item) {
        item.setAttribute("aria-expanded", "false");
      });
      button.setAttribute("aria-expanded", String(!wasOpen));
    });
  });

  var note = document.getElementById("mineral-note");
  if (!note) return;
  var initialNote = note.textContent;

  document.querySelectorAll(".mineral[role='button']").forEach(function (item) {
    function select() {
      document.querySelectorAll(".mineral").forEach(function (other) {
        other.classList.toggle("active", other === item);
      });
      note.textContent = item.getAttribute("data-note") || initialNote;
    }

    function reset() {
      if (document.activeElement === item) return;
      item.classList.remove("active");
      note.textContent = initialNote;
    }

    item.addEventListener("click", select);
    item.addEventListener("focus", select);
    item.addEventListener("blur", reset);
    item.addEventListener("mouseleave", reset);
    item.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
  });
})();
