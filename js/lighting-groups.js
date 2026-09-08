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

  const red = document.querySelector("[data-lighting-group-red]");
  const redOutput = document.querySelector("[data-lighting-group-red-output]");
  const redMinus = document.querySelector("[data-lighting-group-red-minus]");
  const redPlus = document.querySelector("[data-lighting-group-red-plus]");

  const green = document.querySelector("[data-lighting-group-green]");
  const greenOutput = document.querySelector("[data-lighting-group-green-output]");
  const greenMinus = document.querySelector("[data-lighting-group-green-minus]");
  const greenPlus = document.querySelector("[data-lighting-group-green-plus]");

  const blue = document.querySelector("[data-lighting-group-blue]");
  const blueOutput = document.querySelector("[data-lighting-group-blue-output]");
  const blueMinus = document.querySelector("[data-lighting-group-blue-minus]");
  const bluePlus = document.querySelector("[data-lighting-group-blue-plus]");

  const colorWheel = document.querySelector("[data-lighting-group-color-wheel]");
  const colorMarker = document.querySelector("[data-lighting-group-color-marker]");
  const colorSwatch = document.querySelector("[data-lighting-group-color-swatch]");
  const resetButton = document.querySelector("[data-lighting-group-reset]");

  if (
    !openButton || !closeButton || !screen || zones.length !== 12 || aggregateButtons.length !== 3 ||
    !titleOutput || !groupPower || !groupPowerIcon || !groupControls ||
    !brightness || !brightnessOutput || !brightnessMinus || !brightnessPlus ||
    !temperature || !temperatureOutput || !temperatureMinus || !temperaturePlus ||
    !red || !redOutput || !redMinus || !redPlus ||
    !green || !greenOutput || !greenMinus || !greenPlus ||
    !blue || !blueOutput || !blueMinus || !bluePlus ||
    !colorWheel || !colorMarker || !colorSwatch || !resetButton
  ) {
    return;
  }

  // Real DMXWB groups/topics remain intentionally deferred. The browser state below is demo-only.
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
  const controlStates = new Map();

  function selectionKey() {
    return `${selectedKind}:${selectedValue}`;
  }

  function currentControlState() {
    const key = selectionKey();
    if (!controlStates.has(key)) {
      controlStates.set(key, {
        powered: true,
        brightness: 68,
        temperature: 50,
        red: 255,
        green: 255,
        blue: 255,
        colorHue: 0,
        colorSaturation: 0,
      });
    }
    return controlStates.get(key);
  }

  function temperatureLabel(value) {
    if (value < 34) return `Холодный · ${value}`;
    if (value > 66) return `Тёплый · ${value}`;
    return `Нейтральный · ${value}`;
  }

  function hsvToRgb(hue, saturation) {
    const h = ((hue % 360) + 360) % 360;
    const s = Math.min(1, Math.max(0, saturation));
    const c = s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = 1 - c;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  }

  function rgbCss(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  function renderColorControl(state) {
    const angle = state.colorHue * Math.PI / 180;
    const radiusPercent = state.colorSaturation * 46;
    const markerX = 50 + Math.cos(angle) * radiusPercent;
    const markerY = 50 + Math.sin(angle) * radiusPercent;
    const displayColor = rgbCss(hsvToRgb(state.colorHue, state.colorSaturation));

    colorMarker.style.left = `${markerX}%`;
    colorMarker.style.top = `${markerY}%`;
    colorMarker.style.setProperty("--marker-color", displayColor);
    colorSwatch.style.background = displayColor;
    colorWheel.setAttribute("aria-valuetext", displayColor);
    colorWheel.setAttribute("aria-disabled", String(!state.powered));
    colorWheel.tabIndex = state.powered ? 0 : -1;
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

    red.value = String(state.red);
    redOutput.textContent = String(state.red);
    green.value = String(state.green);
    greenOutput.textContent = String(state.green);
    blue.value = String(state.blue);
    blueOutput.textContent = String(state.blue);

    renderColorControl(state);

    groupControls.classList.toggle("is-off", !state.powered);
    for (const control of [
      brightness, brightnessMinus, brightnessPlus,
      temperature, temperatureMinus, temperaturePlus,
      red, redMinus, redPlus,
      green, greenMinus, greenPlus,
      blue, blueMinus, bluePlus,
    ]) {
      control.disabled = !state.powered;
    }
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

    titleOutput.textContent = selectedKind === "group"
      ? groups[selectedValue].title
      : aggregate[selectedValue].title;

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

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  function setBrightness(nextValue) {
    currentControlState().brightness = clamp(nextValue, 0, 100);
    renderControls();
  }

  function setTemperature(nextValue) {
    currentControlState().temperature = clamp(nextValue, 0, 100);
    renderControls();
  }

  function setRgb(channel, nextValue) {
    currentControlState()[channel] = clamp(nextValue, 0, 255);
    renderControls();
  }

  function setColorFromPointer(event) {
    const state = currentControlState();
    if (!state.powered) return;

    const rect = colorWheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const radius = Math.max(1, Math.min(rect.width, rect.height) / 2);

    state.colorHue = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
    state.colorSaturation = Math.min(1, Math.hypot(dx, dy) / radius);
    renderColorControl(state);
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

  red.addEventListener("input", () => setRgb("red", red.value));
  redMinus.addEventListener("click", () => setRgb("red", currentControlState().red - 1));
  redPlus.addEventListener("click", () => setRgb("red", currentControlState().red + 1));

  green.addEventListener("input", () => setRgb("green", green.value));
  greenMinus.addEventListener("click", () => setRgb("green", currentControlState().green - 1));
  greenPlus.addEventListener("click", () => setRgb("green", currentControlState().green + 1));

  blue.addEventListener("input", () => setRgb("blue", blue.value));
  blueMinus.addEventListener("click", () => setRgb("blue", currentControlState().blue - 1));
  bluePlus.addEventListener("click", () => setRgb("blue", currentControlState().blue + 1));

  colorWheel.addEventListener("pointerdown", (event) => {
    if (!currentControlState().powered) return;
    colorWheel.setPointerCapture?.(event.pointerId);
    setColorFromPointer(event);
  });

  colorWheel.addEventListener("pointermove", (event) => {
    if (!colorWheel.hasPointerCapture?.(event.pointerId)) return;
    setColorFromPointer(event);
  });

  colorWheel.addEventListener("keydown", (event) => {
    const state = currentControlState();
    if (!state.powered) return;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      state.colorHue = (state.colorHue + (event.key === "ArrowRight" ? 2 : -2) + 360) % 360;
      event.preventDefault();
      renderColorControl(state);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      state.colorSaturation = clamp(state.colorSaturation + (event.key === "ArrowUp" ? 0.02 : -0.02), 0, 1);
      event.preventDefault();
      renderColorControl(state);
    }
  });

  // Demo only: do not guess DMXWB reset semantics. The real reset command will be wired later.
  resetButton.addEventListener("click", () => {
    resetButton.classList.add("is-pressed");
    window.setTimeout(() => resetButton.classList.remove("is-pressed"), 220);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !screen.hidden) {
      closeScreen();
    }
  });

  render();
})();
