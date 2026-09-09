(() => {
  "use strict";

  const openButton = document.querySelector("[data-lighting-scenes-open]");
  const closeButton = document.querySelector("[data-lighting-scenes-close]");
  const screen = document.querySelector("[data-lighting-scenes-screen]");
  const sceneButtons = Array.from(document.querySelectorAll("[data-lighting-scene]"));

  if (!openButton || !closeButton || !screen || sceneButtons.length === 0) {
    return;
  }

  function openScreen() {
    screen.hidden = false;
    closeButton.focus({ preventScroll: true });
  }

  function closeScreen() {
    screen.hidden = true;
    openButton.focus({ preventScroll: true });
  }

  openButton.addEventListener("click", openScreen);
  closeButton.addEventListener("click", closeScreen);

  // Demo only. Real scene application will later be sent to DMXWB.
  for (const button of sceneButtons) {
    button.addEventListener("click", () => {
      for (const sceneButton of sceneButtons) {
        const active = sceneButton === button;
        sceneButton.classList.toggle("is-active", active);
        sceneButton.setAttribute("aria-pressed", String(active));
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !screen.hidden) {
      closeScreen();
    }
  });
})();
