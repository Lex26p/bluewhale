(() => {
  "use strict";

  const openButton = document.querySelector("[data-fancoil-layout-open]");
  const closeButton = document.querySelector("[data-fancoil-layout-close]");
  const screen = document.querySelector("[data-fancoil-layout-screen]");
  const nodes = Array.from(document.querySelectorAll("[data-fancoil-node]"));
  const mainCount = document.querySelector("[data-fancoil-count]");
  const layoutCount = document.querySelector("[data-fancoil-layout-count]");
  const generalPower = document.querySelector("[data-fancoil-power]");

  if (!openButton || !closeButton || !screen || nodes.length !== 7 || !mainCount || !layoutCount) {
    return;
  }

  // WEB-05 demo only. Real individual WB/MQTT states are intentionally deferred.
  const states = new Map(nodes.map((node) => [node.dataset.fancoilNode, true]));

  function enabledCount() {
    let count = 0;
    for (const enabled of states.values()) {
      if (enabled) count += 1;
    }
    return count;
  }

  function renderNode(node) {
    const id = node.dataset.fancoilNode;
    const enabled = states.get(id) === true;

    node.classList.toggle("is-on", enabled);
    node.setAttribute("aria-pressed", String(enabled));
    node.setAttribute("aria-label", `Фанкойл ${id}, ${enabled ? "включен" : "выключен"}`);
  }

  function renderCounts() {
    const count = enabledCount();
    const text = `${count} из 7`;
    mainCount.textContent = text;
    layoutCount.textContent = text;
  }

  function renderAll() {
    nodes.forEach(renderNode);
    renderCounts();
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

  screen.addEventListener("click", (event) => {
    const node = event.target.closest("[data-fancoil-node]");
    if (!node || !screen.contains(node)) {
      return;
    }

    const id = node.dataset.fancoilNode;
    states.set(id, !(states.get(id) === true));
    renderNode(node);
    renderCounts();
  });

  if (generalPower) {
    generalPower.addEventListener("click", () => {
      // app.js handles the common toggle first; mirror its resulting state to the seven demo nodes.
      const powered = generalPower.getAttribute("aria-pressed") === "true";
      for (const id of states.keys()) {
        states.set(id, powered);
      }
      renderAll();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !screen.hidden) {
      closeScreen();
    }
  });

  renderAll();
})();
