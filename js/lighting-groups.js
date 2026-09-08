(() => {
  "use strict";

  const openButton = document.querySelector("[data-lighting-groups-open]");
  const closeButton = document.querySelector("[data-lighting-groups-close]");
  const screen = document.querySelector("[data-lighting-groups-screen]");
  const zones = Array.from(document.querySelectorAll("[data-lighting-group]"));
  const aggregateButtons = Array.from(document.querySelectorAll("[data-lighting-aggregate]"));
  const titleOutput = document.querySelector("[data-lighting-selection-title]");
  const groupPower = document.querySelector("[data-lighting-group-power]");
  const groupPowerIcon = document.querySelector("[data-lighting-group-power-icon]");
  const groupControls = document.querySelector(".lighting-group-controls");
  const brightness = document.querySelector("[data-lighting-group-brightness]");
  const brightnessOutput = document.querySelector("[data-lighting-group-brightness-output]");
  const brightnessMinus = document.querySelector("[data-lighting-group-brightness-minus]");
  const brightnessPlus = document.querySelector("[data-lighting-group-brightness-plus]");
  const temperature = document.querySelector("[data-lighting-group-temperature]");
  const temperatureOutput = document.querySelector("[data-lighting-group-temperature-output]");
  const temperatureMinus = document.querySelector("[data-lighting-group-temperature-minus]");
  const temperaturePlus = document.querySelector("[data-lighting-group-temperature-plus]");

  if (!openButton || !closeButton || !screen || zones.length !== 12 || aggregateButtons.length !== 3 || !titleOutput || !groupPower || !groupPowerIcon || !groupControls || !brightness || !brightnessOutput || !brightnessMinus || !brightnessPlus || !temperature || !temperatureOutput || !temperatureMinus || !temperaturePlus) {
    return;
  }

  // WEB-09A demo selection only. Real DMXWB groups and topics are intentionally deferred.
  const groups = {
    "1": { title: "Группа 1", detail: "Светильник 1", type: "linear" },
    "2": { title: "Группа 2", detail: "Светильник 2", type: "linear" },
    "3": { title: "Группа 3", detail: "Светильники 3–8", type: "linear" },
    "4": { title: "Группа 4", detail: "Светодиодная лента 9", type: "strips" },
    "5": { title: "Группа 5", detail: "Светильники 10–16", type: "linear" },
    "6": { title: "Группа 6", detail: "Светодиодная лента 17", type: "strips" },
    "7": { title: "Группа 7", detail: "Светильники 18–23", type: "linear" },
    "8": { title: "Группа 8", detail: "Светодиодная лента 24", type: "strips" },
    "9": { title: "Группа 9", detail: "Светильники 25–31", type: "linear" },
    "10": { title: "Группа 10", detail: "Светодиодная лента 32", type: "strips" },
    "11": { title: "Группа 11", detail: "Светильники 33–38", type: "linear" },
    "12": { title: "Группа 12", detail: "Светодиодная лента 39", type: "strips" },
  };

  const aggregate = {
    all: { title: "Все светильники", detail: "1–39" },
    linear: { title: "Все линейные", detail: "Все линейные светильники" },
    strips: { title: "Все ленты", detail: "9 · 17 · 24 · 32 · 39" },
  };

  let selectedKind = "aggregate";
  let selectedValue = "all";

  // WEB-09B demo values only. DMXWB will later be the source of truth for every selected group.
  const controlStates = new Map();

  function selectionKey() {
    return `${selectedKind}:${selectedValue}`;
  }

  function currentControlState() {
    const key = selectionKey();
    if (!controlStates.has(key)) {
      controlStates.set(key, { powered: true, brightness: 68, temperature: 50 });
    }
    return controlStates.get(key);
  }

  function temperatureLabel(value) {
    if (value < 34) return `Холодный · ${value}`;
    if (value > 66) return `Тёплый · ${value}`;
    return `Нейтральный · ${value}`;
  }

  function renderControls() {
    const state = currentControlState();
    groupPower.setAttribute("aria-pressed", String(state.powered));
    groupPower.setAttribute("aria-label", state.powered ? "Выключить выбранную группу" : "Включить выбранную группу");
    groupPowerIcon.src = state.powered ? "images/TumblerOn.svg" : "images/TumblerOff.svg";

    brightness.value = String(state.brightness);
    brightnessOutput.textContent = `${state.brightness}%`;
    brightness.style.setProperty("--group-range-progress", `${state.brightness}%`);

    temperature.value = String(state.temperature);
    temperatureOutput.textContent = temperatureLabel(state.temperature);

    groupControls.classList.toggle("is-off", !state.powered);
    brightness.disabled = !state.powered;
    brightnessMinus.disabled = !state.powered;
    brightnessPlus.disabled = !state.powered;
    temperature.disabled = !state.powered;
    temperatureMinus.disabled = !state.powered;
    temperaturePlus.disabled = !state.powered;
  }

  function render() {
    const selectedAggregate = selectedKind === "aggregate" ? selectedValue : null;

    for (const button of aggregateButtons) {
      const active = button.dataset.lightingAggregate === selectedAggregate;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    for (const zone of zones) {
      const id = zone.dataset.lightingGroup;
      const group = groups[id];
      const selected = selectedKind === "group" && selectedValue === id;
      const related = selectedAggregate === "all" || selectedAggregate === group.type;

      zone.classList.toggle("is-selected", selected);
      zone.classList.toggle("is-related", related && !selected);
      zone.setAttribute("aria-pressed", String(selected));
      zone.setAttribute("aria-label", `${group.title}: ${group.detail}`);
    }

    if (selectedKind === "group") {
      titleOutput.textContent = groups[selectedValue].title;
    } else {
      titleOutput.textContent = aggregate[selectedValue].title;
    }

    renderControls();
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

  for (const button of aggregateButtons) {
    button.addEventListener("click", () => {
      selectedKind = "aggregate";
      selectedValue = button.dataset.lightingAggregate;
      render();
    });
  }

  for (const zone of zones) {
    zone.addEventListener("click", () => {
      selectedKind = "group";
      selectedValue = zone.dataset.lightingGroup;
      render();
    });
  }

  function setBrightness(nextValue) {
    const state = currentControlState();
    state.brightness = Math.min(100, Math.max(0, Number(nextValue)));
    renderControls();
  }

  function setTemperature(nextValue) {
    const state = currentControlState();
    state.temperature = Math.min(100, Math.max(0, Number(nextValue)));
    renderControls();
  }

  groupPower.addEventListener("click", () => {
    const state = currentControlState();
    state.powered = !state.powered;
    renderControls();
  });

  brightness.addEventListener("input", () => setBrightness(brightness.value));
  brightnessMinus.addEventListener("click", () => setBrightness(currentControlState().brightness - 1));
  brightnessPlus.addEventListener("click", () => setBrightness(currentControlState().brightness + 1));

  temperature.addEventListener("input", () => setTemperature(temperature.value));
  temperatureMinus.addEventListener("click", () => setTemperature(currentControlState().temperature - 1));
  temperaturePlus.addEventListener("click", () => setTemperature(currentControlState().temperature + 1));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !screen.hidden) {
      closeScreen();
    }
  });

  render();
})();
