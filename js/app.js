(() => {
  "use strict";

  const wheel = document.querySelector("#temperature-wheel");
  const cylinder = document.querySelector("[data-wheel-cylinder]");
  const output = document.querySelector("#setpoint-value");

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
    if (event.button !== undefined && event.button !== 0) {
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

  renderWheel();
})();
