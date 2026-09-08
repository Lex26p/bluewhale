(() => {
  "use strict";

  const wheel = document.querySelector("#temperature-wheel");
  const cylinder = document.querySelector("[data-wheel-cylinder]");
  const output = document.querySelector("#setpoint-value");
  const climateCard = document.querySelector(".climate-card");

  if (!wheel || !cylinder || !output) {
    return;
  }

  // WEB-02 demo contract. Real WB/MQTT integration is intentionally deferred.
  const MIN_VALUE = 18;
  const MAX_VALUE = 28;
  const STEP = 1;
  const INITIAL_VALUE = 21;

  // The old Blue Whale used approximately 24 px of horizontal movement per 1 °C.
  // This implementation is new, but keeps that physical feel and the cylindrical ruler idea.
  const PIXELS_PER_DEGREE = 24;
  const CYLINDER_RADIUS = 152;
  const MAX_ANGLE = 1.28;
  const VISUAL_TICK_MIN = 10;
  const VISUAL_TICK_MAX = 35;

  let visualValue = INITIAL_VALUE;
  let value = INITIAL_VALUE;
  let dragging = false;
  let activePointerId = null;
  let dragStartX = 0;
  let dragStartValue = INITIAL_VALUE;
  let airingLocked = false;
  let savedValueBeforeAiring = INITIAL_VALUE;

  const ticks = [];

  function clamp(number, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, number));
  }

  function snap(number) {
    const snapped = Math.round(number / STEP) * STEP;
    return clamp(snapped, MIN_VALUE, MAX_VALUE);
  }

  function makeTick(tickValue) {
    const tick = document.createElement("div");
    const major = tickValue % 5 === 0;

    tick.className = major ? "wheel-tick wheel-tick--major" : "wheel-tick";
    tick.dataset.value = String(tickValue);

    const line = document.createElement("div");
    line.className = "wheel-tick__line";
    tick.append(line);

    if (major) {
      const label = document.createElement("div");
      label.className = "wheel-tick__label";
      label.textContent = String(tickValue);
      tick.append(label);
    }

    cylinder.append(tick);
    ticks.push({ element: tick, value: tickValue });
  }

  for (let tickValue = VISUAL_TICK_MIN; tickValue <= VISUAL_TICK_MAX; tickValue += 1) {
    makeTick(tickValue);
  }

  function renderWheel() {
    for (const tick of ticks) {
      const linearOffset = (tick.value - visualValue) * PIXELS_PER_DEGREE;
      const angle = linearOffset / CYLINDER_RADIUS;
      const absoluteAngle = Math.abs(angle);

      if (absoluteAngle > MAX_ANGLE) {
        tick.element.style.visibility = "hidden";
        continue;
      }

      const x = Math.sin(angle) * CYLINDER_RADIUS;
      const depth = Math.max(0, Math.cos(angle));
      const opacity = 0.26 + depth * 0.74;
      const verticalScale = 0.82 + depth * 0.18;

      tick.element.style.visibility = "visible";
      tick.element.style.left = `calc(50% + ${x.toFixed(2)}px)`;
      tick.element.style.opacity = opacity.toFixed(3);
      tick.element.style.transform = `translateX(-50%) scaleY(${verticalScale.toFixed(3)})`;
    }

    const shownValue = snap(visualValue);
    output.value = String(shownValue);
    output.textContent = String(shownValue);
    wheel.setAttribute("aria-valuenow", String(shownValue));
    wheel.setAttribute("aria-valuetext", `${shownValue} градусов`);
  }

  function setValue(nextValue, { smoothPosition = false } = {}) {
    value = snap(nextValue);
    visualValue = smoothPosition ? clamp(nextValue, MIN_VALUE, MAX_VALUE) : value;
    renderWheel();
  }

  function finishDrag(pointerId) {
    if (!dragging || pointerId !== activePointerId) {
      return;
    }

    dragging = false;
    activePointerId = null;
    wheel.classList.remove("is-dragging");
    setValue(visualValue);
  }

  wheel.addEventListener("pointerdown", (event) => {
    if (airingLocked || (event.button !== undefined && event.button !== 0)) {
      return;
    }

    dragging = true;
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartValue = visualValue;
    wheel.classList.add("is-dragging");
    wheel.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });

  wheel.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== activePointerId) {
      return;
    }

    // Dragging the ruler to the right exposes lower temperatures, just like the old UI.
    const deltaX = event.clientX - dragStartX;
    const nextVisualValue = dragStartValue - deltaX / PIXELS_PER_DEGREE;
    visualValue = clamp(nextVisualValue, MIN_VALUE, MAX_VALUE);
    value = snap(visualValue);
    renderWheel();
    event.preventDefault();
  });

  wheel.addEventListener("pointerup", (event) => {
    finishDrag(event.pointerId);
  });

  wheel.addEventListener("pointercancel", (event) => {
    finishDrag(event.pointerId);
  });

  wheel.addEventListener("lostpointercapture", () => {
    if (dragging) {
      dragging = false;
      activePointerId = null;
      wheel.classList.remove("is-dragging");
      setValue(visualValue);
    }
  });

  wheel.addEventListener("keydown", (event) => {
    if (airingLocked) {
      return;
    }

    let nextValue = value;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        nextValue -= STEP;
        break;
      case "ArrowRight":
      case "ArrowUp":
        nextValue += STEP;
        break;
      case "Home":
        nextValue = MIN_VALUE;
        break;
      case "End":
        nextValue = MAX_VALUE;
        break;
      default:
        return;
    }

    event.preventDefault();
    setValue(nextValue);
  });

  document.addEventListener("bluewhale:airing-start", () => {
    if (airingLocked) {
      return;
    }

    savedValueBeforeAiring = value;
    airingLocked = true;
    setValue(MIN_VALUE);
    wheel.setAttribute("aria-disabled", "true");
    wheel.tabIndex = -1;
    climateCard?.classList.add("is-airing-locked");
  });

  document.addEventListener("bluewhale:airing-stop", () => {
    if (!airingLocked) {
      return;
    }

    airingLocked = false;
    setValue(savedValueBeforeAiring);
    wheel.removeAttribute("aria-disabled");
    wheel.tabIndex = 0;
    climateCard?.classList.remove("is-airing-locked");
  });

  renderWheel();
})();


(() => {
  "use strict";

  const powerButton = document.querySelector("[data-fancoil-power]");
  const powerIcon = document.querySelector("[data-fancoil-power-icon]");
  const speedGroup = document.querySelector("[data-fancoil-speed]");
  const factual = document.querySelector("[data-fancoil-fact]");
  const enabledCountOutput = document.querySelector("[data-fancoil-count]");
  const card = document.querySelector(".fan-coil-card");
  const layoutAction = document.querySelector("[data-fancoil-layout-open]");

  if (!powerButton || !powerIcon || !speedGroup || !factual || !enabledCountOutput) {
    return;
  }

  // WEB-04 demo only. Real WB/MQTT commands are intentionally deferred.
  const TOTAL_FAN_COILS = 7;
  let powered = true;
  let selectedSpeed = "auto";
  let factualSpeed = "2";
  let airingLocked = false;
  let savedBeforeAiring = null;
  const speedButtons = Array.from(speedGroup.querySelectorAll("[data-value]"));

  function render() {
    powerButton.setAttribute("aria-pressed", String(powered));
    powerButton.setAttribute("aria-label", powered ? "Выключить фанкойлы" : "Включить фанкойлы");
    powerIcon.src = powered ? "images/TumblerOn.svg" : "images/TumblerOff.svg";

    factual.textContent = powered ? factualSpeed : "—";
    enabledCountOutput.textContent = `${powered ? TOTAL_FAN_COILS : 0} из ${TOTAL_FAN_COILS}`;
    factual.parentElement?.classList.toggle("is-off", !powered);

    for (const button of speedButtons) {
      const active = button.dataset.value === selectedSpeed;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.disabled = !powered || airingLocked;
    }

    powerButton.disabled = airingLocked;
    if (layoutAction) {
      layoutAction.disabled = airingLocked;
    }
    card?.classList.toggle("is-airing-locked", airingLocked);
  }

  powerButton.addEventListener("click", () => {
    if (airingLocked) {
      return;
    }
    powered = !powered;
    render();
  });

  speedGroup.addEventListener("click", (event) => {
    const button = event.target.closest("[data-value]");
    if (!button || !speedGroup.contains(button) || !powered || airingLocked) {
      return;
    }

    selectedSpeed = button.dataset.value;
    if (selectedSpeed !== "auto") {
      factualSpeed = selectedSpeed;
    } else {
      factualSpeed = "2";
    }
    render();
  });

  document.addEventListener("bluewhale:airing-start", () => {
    if (airingLocked) {
      return;
    }

    savedBeforeAiring = { powered, selectedSpeed, factualSpeed };
    airingLocked = true;
    powered = true;
    selectedSpeed = "3";
    factualSpeed = "3";
    render();
  });

  document.addEventListener("bluewhale:airing-stop", () => {
    if (!airingLocked || !savedBeforeAiring) {
      return;
    }

    ({ powered, selectedSpeed, factualSpeed } = savedBeforeAiring);
    savedBeforeAiring = null;
    airingLocked = false;
    render();
  });

  render();
})();


(() => {
  "use strict";

  const powerButton = document.querySelector("[data-ventilation-power]");
  const powerIcon = document.querySelector("[data-ventilation-power-icon]");
  const speedGroup = document.querySelector("[data-ventilation-speed]");
  const factual = document.querySelector("[data-ventilation-fact]");
  const card = document.querySelector(".ventilation-card");

  if (!powerButton || !powerIcon || !speedGroup || !factual) {
    return;
  }

  // WEB-06 demo only. Real WB/Modbus/MQTT commands are intentionally deferred.
  let powered = true;
  let selectedSpeed = "auto";
  let factualSpeed = "2";
  let airingLocked = false;
  let savedBeforeAiring = null;
  const speedButtons = Array.from(speedGroup.querySelectorAll("[data-value]"));

  function render() {
    powerButton.setAttribute("aria-pressed", String(powered));
    powerButton.setAttribute("aria-label", powered ? "Выключить вентиляцию" : "Включить вентиляцию");
    powerIcon.src = powered ? "images/TumblerOn.svg" : "images/TumblerOff.svg";

    factual.textContent = powered ? factualSpeed : "—";
    factual.parentElement?.classList.toggle("is-off", !powered);

    for (const button of speedButtons) {
      const active = button.dataset.value === selectedSpeed;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.disabled = !powered || airingLocked;
    }

    powerButton.disabled = airingLocked;
    card?.classList.toggle("is-airing-locked", airingLocked);
  }

  powerButton.addEventListener("click", () => {
    if (airingLocked) {
      return;
    }
    powered = !powered;
    render();
  });

  speedGroup.addEventListener("click", (event) => {
    const button = event.target.closest("[data-value]");
    if (!button || !speedGroup.contains(button) || !powered || airingLocked) {
      return;
    }

    selectedSpeed = button.dataset.value;
    factualSpeed = selectedSpeed === "auto" ? "2" : selectedSpeed;
    render();
  });

  document.addEventListener("bluewhale:airing-start", () => {
    if (airingLocked) {
      return;
    }

    savedBeforeAiring = { powered, selectedSpeed, factualSpeed };
    airingLocked = true;
    powered = true;
    selectedSpeed = "3";
    factualSpeed = "3";
    render();
  });

  document.addEventListener("bluewhale:airing-stop", () => {
    if (!airingLocked || !savedBeforeAiring) {
      return;
    }

    ({ powered, selectedSpeed, factualSpeed } = savedBeforeAiring);
    savedBeforeAiring = null;
    airingLocked = false;
    render();
  });

  render();
})();


(() => {
  "use strict";

  const card = document.querySelector("[data-airing-card]");
  const powerButton = document.querySelector("[data-airing-power]");
  const powerIcon = document.querySelector("[data-airing-power-icon]");
  const status = document.querySelector("[data-airing-status]");
  const timeLabel = document.querySelector("[data-airing-time-label]");
  const timeOutput = document.querySelector("[data-airing-time]");
  const minusButton = document.querySelector("[data-airing-minus]");
  const plusButton = document.querySelector("[data-airing-plus]");

  if (!card || !powerButton || !powerIcon || !status || !timeLabel || !timeOutput || !minusButton || !plusButton) {
    return;
  }

  // WEB-07 demo only. The production timer and restore logic will live in WB Rules.
  const MIN_MINUTES = 1;
  const MAX_MINUTES = 60;
  let durationMinutes = 5;
  let active = false;
  let endAt = 0;
  let timerId = null;

  function clampMinutes(minutes) {
    return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, minutes));
  }

  function formatTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function remainingSeconds() {
    if (!active) {
      return durationMinutes * 60;
    }
    return Math.max(0, (endAt - Date.now()) / 1000);
  }

  function render() {
    powerButton.setAttribute("aria-pressed", String(active));
    powerButton.setAttribute("aria-label", active ? "Выключить проветривание" : "Включить проветривание");
    powerIcon.src = active ? "images/TumblerOn.svg" : "images/TumblerOff.svg";
    card.classList.toggle("is-active", active);

    status.textContent = active ? "Активно · климат управляется проветриванием" : "Готово к запуску";
    timeLabel.textContent = active ? "Осталось" : "Время проветривания";
    timeOutput.textContent = formatTime(remainingSeconds());

    const timeControlsEnabled = active;
    card.classList.toggle("is-time-locked", !timeControlsEnabled);
    timeOutput.setAttribute("aria-disabled", String(!timeControlsEnabled));
    minusButton.disabled = !timeControlsEnabled || durationMinutes <= MIN_MINUTES;
    plusButton.disabled = !timeControlsEnabled || durationMinutes >= MAX_MINUTES;
  }

  function dispatch(name) {
    document.dispatchEvent(new CustomEvent(name));
  }

  function stopAiring() {
    if (!active) {
      return;
    }

    active = false;
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    dispatch("bluewhale:airing-stop");
    render();
  }

  function tick() {
    if (!active) {
      return;
    }

    if (remainingSeconds() <= 0) {
      stopAiring();
      return;
    }
    render();
  }

  function startAiring() {
    if (active) {
      return;
    }

    active = true;
    endAt = Date.now() + durationMinutes * 60 * 1000;
    dispatch("bluewhale:airing-start");
    timerId = window.setInterval(tick, 1000);
    render();
  }

  function changeDuration(deltaMinutes) {
    const nextMinutes = clampMinutes(durationMinutes + deltaMinutes);
    if (nextMinutes === durationMinutes) {
      return;
    }

    durationMinutes = nextMinutes;
    if (active) {
      endAt += deltaMinutes * 60 * 1000;
      if (endAt <= Date.now()) {
        stopAiring();
        return;
      }
    }
    render();
  }

  powerButton.addEventListener("click", () => {
    if (active) {
      stopAiring();
    } else {
      startAiring();
    }
  });

  minusButton.addEventListener("click", () => changeDuration(-1));
  plusButton.addEventListener("click", () => changeDuration(1));

  render();
})();


(() => {
  "use strict";

  const card = document.querySelector("[data-lighting-card]");
  const powerButton = document.querySelector("[data-lighting-power]");
  const powerIcon = document.querySelector("[data-lighting-power-icon]");
  const brightness = document.querySelector("[data-lighting-brightness]");
  const brightnessOutput = document.querySelector("[data-lighting-brightness-output]");
  const temperature = document.querySelector("[data-lighting-temperature]");
  const temperatureOutput = document.querySelector("[data-lighting-temperature-output]");

  if (!card || !powerButton || !powerIcon || !brightness || !brightnessOutput || !temperature || !temperatureOutput) {
    return;
  }

  // WEB-08 demo only. Real DMXWB/MQTT commands are intentionally deferred.
  let powered = true;

  function temperatureLabel(value) {
    const numericValue = Number(value);
    if (numericValue < 34) return "Холодный";
    if (numericValue > 66) return "Тёплый";
    return "Нейтральный";
  }

  function syncBrightnessTrack() {
    brightness.style.setProperty("--range-progress", `${brightness.value}%`);
  }

  function render() {
    powerButton.setAttribute("aria-pressed", String(powered));
    powerButton.setAttribute("aria-label", powered ? "Выключить освещение" : "Включить освещение");
    powerIcon.src = powered ? "images/TumblerOn.svg" : "images/TumblerOff.svg";

    brightness.disabled = !powered;
    temperature.disabled = !powered;
    card.classList.toggle("is-off", !powered);

    brightnessOutput.textContent = `${brightness.value}%`;
    temperatureOutput.textContent = temperatureLabel(temperature.value);
    syncBrightnessTrack();
  }

  powerButton.addEventListener("click", () => {
    powered = !powered;
    render();
  });

  brightness.addEventListener("input", render);
  temperature.addEventListener("input", render);

  render();
})();

