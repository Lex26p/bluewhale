# Blue Whale — Development Roadmap

**Статус:** рабочая дорожная карта реализации `docs/TECHNICAL_SPEC.md`  
**Дата основания:** 2026-09-08  
**Repository:** `Lex26p/bluewhale`  
**Local project:** `C:\Projects\bluewhale`  

## 1. Назначение roadmap

Этот документ определяет **порядок разработки и PASS-критерии**, но не заменяет техническое задание.

При конфликте документов по продуктовым требованиям приоритет:

1. `docs/TECHNICAL_SPEC.md` — что должна делать конечная система.
2. `docs/ROADMAP.md` — в каком порядке это реализуется.
3. `docs/PROJECT_STATE.md` — где находится текущая работа.
4. `AGENTS.md` — как ассистент и пользователь взаимодействуют.

Перед каждым шагом ассистент заново читает актуальный репозиторий.

## 2. Development layers

Разработка имеет два уровня:

```text
SPRINT
  -> STEP
```

Спринт — крупная область системы.

Шаг — конкретная завершённая задача внутри спринта.

Шаг получает PASS только после пользовательской/технической проверки согласно его критериям.

## 3. Общий порядок спринтов

```text
DOC — Documentation / Foundation
      |
WEB — Static Web UI / UX
      |
RULES — Wiren Board Rules / Virtual Controls
      |
JS — Web JavaScript / MQTT Integration
      |
FINAL — End-to-End Integration / Acceptance
```

Логика порядка намеренная:

1. сначала фиксируется документация и процесс;
2. затем согласуется весь Web UX без зависимости от backend;
3. затем создаётся понятный high-level contract на Wiren Board;
4. затем готовый Web подключается к реальным factual states;
5. в конце проверяется система целиком.

Такой порядок не позволяет backend-ограничениям преждевременно диктовать плохой UI и одновременно не заставляет переписывать JS после каждого дизайнерского изменения.

---

# SPRINT DOC — Documentation / Foundation

## DOC-001 — Base project documentation

### Цель

Создать нормативную основу нового репозитория, чтобы будущая модель/разработчик мог восстановить контекст проекта без чтения всей истории чата.

### Реализовать

```text
AGENTS.md
README.md
docs/TECHNICAL_SPEC.md
docs/ROADMAP.md
docs/PROJECT_STATE.md
```

### Не включать

- HTML UI;
- CSS;
- Web JS logic;
- MQTT;
- WB Rules;
- изменения DMXWB.

### PASS

- документация соответствует фактически согласованным требованиям;
- явно записано, что старый код не переносится;
- явно записано, что ассистент не пишет в GitHub;
- записаны Windows path и user-owned Git workflow;
- описаны Web/WB Rules/DMXWB boundaries;
- описан iPad touch-first target;
- описано поведение ART-NET source в Web;
- пользователь принимает документацию и делает commit/push.

После PASS начинается `WEB-01`.

---

# SPRINT WEB — Static Web UI / UX

## Общие правила спринта

Этот спринт создаёт внешний вид и локальное UX-поведение.

В `WEB` запрещено вводить реальную связь с Wiren Board/DMXWB как обязательную часть шага.

Данные могут быть демонстрационными:

```text
22.4 °C
42 %
460 ppm
```

Кнопки/слайдеры могут локально менять demo-state только ради оценки UX.

Главный acceptance target — iPad landscape.

## WEB-01 — General Page / Layout

### Цель

Создать первую реальную статическую страницу и согласовать геометрию главного экрана.

### Реализовать

- `index.html`;
- базовый `css/app.css`;
- при необходимости минимальный `js/app.js` только для demo UI;
- общий header;
- основные cards/regions;
- placeholder climate information;
- placeholder fan coil block;
- placeholder ventilation block;
- placeholder airing block;
- placeholder lighting block;
- фиксированный tablet canvas `1024×768` для iPad landscape;
- центрированное отображение этого же canvas на больших desktop-экранах без fluid-растяжения.

### Не включать

- полноценный setpoint control;
- реальные режимы;
- планы оборудования;
- MQTT;
- WB data.

### PASS

- страница открывается локально;
- layout рассчитан на tablet canvas `1024×768`;
- на большом desktop-экране интерфейс не растягивается и не «плывёт», а сохраняет планшетные размеры;
- layout пригоден для iPad landscape;
- нет обязательного hover UX;
- пользователь принимает общую геометрию и визуальное направление.

## WEB-02 — Temperature Setpoint

### Цель

Реализовать главный touch-control температурной уставки.

### Реализовать

- крупное setpoint value;
- горизонтальную шкалу;
- tap/drag control;
- demo-state;
- touch UX;
- выбранные minimum/maximum/step после согласования.

### PASS

- на iPad значение удобно менять пальцем;
- управление не требует мыши/hover;
- визуально соответствует согласованному направлению;
- пользователь принимает final UX уставки.

## WEB-03 — Room Metrics

### Цель

Согласовать отображение фактической температуры, влажности и CO₂.

### PASS

- три показателя читаемы с основного экрана;
- единицы измерения понятны;
- вторичные показатели не перегружают интерфейс.

## WEB-04 — General Fan Coil Control

### Цель

Создать card общего управления фанкойлами.

### Реализовать

- power/state;
- согласованные режимы;
- согласованные скорости;
- Auto, если утверждён;
- navigation/action к individual layout.

### PASS

- все основные действия выполняются крупными touch controls;
- active state очевиден;
- card не перегружен технической информацией.

## WEB-05 — Individual Fan Coil Layout

### Цель

Создать пространственный экран 7 фанкойлов.

### Реализовать

- план/условную схему зала;
- 7 fan coil nodes;
- individual `ON/OFF`;
- state indication;
- возврат на основной экран.

### PASS

- пользователь может быстро сопоставить fan coil на экране с его физическим местом;
- tap удобно работает на iPad;
- никакой лишней индивидуальной настройки температуры/скорости нет.

## WEB-06 — Ventilation

### Цель

Создать пользовательский блок вентиляции.

### Реализовать

- фактический/выбранный state;
- power;
- согласованные speed/mode controls;
- Auto при необходимости.

### PASS

- UI соответствует фактической модели, согласованной пользователем;
- основные commands доступны одним уровнем;
- card touch-friendly.

## WEB-07 — Airing Scenario

### Цель

Создать UX сценария «Проветривание».

### Реализовать

- Start/Stop;
- duration;
- remaining time demo;
- `+/-` или другой согласованный способ изменения времени;
- активное визуальное состояние;
- индикацию того, что climate systems управляются этим сценарием.

### PASS

- пользователь сразу видит, что проветривание активно;
- оставшееся время читаемо;
- длительность удобно менять;
- обычные climate controls визуально ведут себя понятно во время сценария.

## WEB-08 — Lighting Main Block / Source

### Цель

Добавить освещение на главный экран и согласовать Source UX.

### Реализовать

- Lighting card;
- summary state;
- переход к подробному lighting plan;
- Source `WB MQTT / ART-NET`;
- demo active source indication.

### PASS

- active source виден без открытия service menu;
- Source удобно переключается пальцем;
- пользователь понимает, кто сейчас управляет светом.

## WEB-09 — Lighting Plan / Fixture and Group Selection

### Цель

Создать spatial lighting selection.

### Реализовать

- план помещения;
- selectable fixtures;
- selectable groups/zones;
- selected entity title;
- при необходимости `Whole Room`.

### PASS

- individual fixture и group визуально различимы;
- выбранный entity очевиден;
- touch selection надёжен.

## WEB-10 — RGBW Control Panel

### Цель

Создать детальный user-friendly control выбранного Fixture/Group.

### Реализовать

- Power;
- RGB color UX;
- Brightness;
- white/Temperature control по модели DMXWB;
- demo values;
- крупные touch controls.

### PASS

- управление удобно на iPad;
- raw technical RGB values не перегружают основной UX;
- пользователь принимает способ выбора цвета и белого.

## WEB-11 — Lighting Scenes

### Цель

Создать полный UX lifecycle сцен.

### Реализовать

- scene list;
- Apply;
- Create;
- Rename;
- Overwrite;
- Delete;
- простое понятное подтверждение деструктивных действий.

### PASS

- lifecycle понятен без технических знаний DMX;
- touch UI не перегружен;
- пользователь принимает расположение и действия.

## WEB-12 — ART-NET Disabled Lighting State

### Цель

Довести поведение интерфейса при внешнем source.

### Реализовать

При `ART-NET` demo-state:

- lighting controls disabled;
- явно отображается ART-NET control;
- Source selector остаётся доступен;
- нет тревожной/избыточной security стилистики.

### PASS

- пользователь однозначно понимает причину disabled controls;
- вернуть `WB MQTT` можно сразу;
- UI не выглядит как аварийный экран без причины.

## WEB-13 — UI Polish / iPad Acceptance

### Цель

Завершить весь визуальный спринт перед backend-разработкой.

### Проверить

- iPad Safari landscape;
- desktop browser;
- touch target sizes;
- text selection/touch artifacts;
- overflow;
- typography;
- cards spacing;
- disabled/active states;
- modal/panel navigation;
- отсутствие Internet dependencies.

### PASS

Пользователь принимает весь Web UI как foundation для последующей реальной интеграции.

---

# SPRINT RULES — Wiren Board Rules / Virtual Controls

## Общая цель

Создать high-level contract между оборудованием и будущим Web JS.

Web не должен знать raw relay outputs или raw Modbus registers там, где можно предоставить понятные виртуальные controls.

Точные topic/device names должны утверждаться в этом спринте и затем фиксироваться в `TECHNICAL_SPEC.md`.

## RULES-01 — Climate virtual device contract

Определить devices/controls для:

- room values;
- temperature setpoint;
- general fan coil controls;
- individual fan coil power;
- ventilation;
- airing.

PASS: contract документирован и виден/управляем в WB.

## RULES-02 — General fan coil automation

Реализовать high-level fan coil commands через фактические relay outputs.

PASS: команды/состояния соответствуют согласованному UI contract.

## RULES-03 — Individual fan coil ON/OFF

Реализовать 7 individual power controls и необходимые связи с общей логикой.

PASS: каждый physical fan coil корректно включается/выключается индивидуально.

## RULES-04 — Ventilation Modbus automation

Реализовать high-level ventilation controls поверх фактического Modbus устройства.

PASS: команды и factual state проверены на вентиляционной установке.

## RULES-05 — Airing automation

Реализовать:

- save previous state;
- maximum fan coils;
- maximum ventilation;
- minimum temperature setpoint;
- timer;
- duration update;
- stop/timeout;
- restore previous state.

PASS: сценарий полностью выполняется на WB независимо от открытого Web.

## RULES-06 — Rules integration / state sanity

Проверить взаимодействие климата целиком и подготовить стабильный MQTT contract для JS sprint.

PASS: factual controls достаточно стабильны, чтобы подключать Web.

---

# SPRINT JS — Web JavaScript / MQTT Integration

## Общая цель

Подключить уже утверждённый UI к реальному Wiren Board и DMXWB.

Используется локальный MQTT WebSocket `/mqtt`.

JS должен быть организован так, чтобы transport/state mapping не смешивались хаотично с DOM layout.

## JS-01 — MQTT transport and application state

Реализовать:

- WebSocket MQTT connection;
- subscribe/publish layer;
- reconnect;
- factual connection state;
- базовый state store/model;
- отсутствие stale command replay после reconnect.

PASS: Web стабильно подключается к локальному broker и восстанавливается после временного disconnect.

## JS-02 — Room metrics and setpoint

Подключить temperature/humidity/CO₂ и temperature setpoint.

PASS: UI отражает factual state и отправляет согласованные команды.

## JS-03 — Fan coil integration

Подключить general fan coil и 7 individual controls.

PASS: UI и physical/WB states согласованы.

## JS-04 — Ventilation integration

Подключить ventilation controls/states.

PASS: Web отражает factual state и команды реально действуют.

## JS-05 — Airing integration

Подключить Start/Stop, duration, remaining/state к WB Rules.

PASS: browser можно закрыть/открыть, а сценарий на WB продолжает жить и Web после возврата показывает его factual state.

## JS-06 — DMXWB Fixture/Group integration

Подключить:

- config/state discovery;
- Fixture controls;
- Group controls;
- selected entity;
- Color/Brightness/Temperature/Power.

PASS: individual/group commands работают с реальным DMXWB.

## JS-07 — DMXWB Scene lifecycle

Подключить Create/Apply/Rename/Overwrite/Delete и correlated results.

PASS: все scene actions проходят end-to-end и UI показывает factual outcome.

## JS-08 — DMX Source integration

Подключить factual Source и selector.

Обязательное поведение:

```text
source=mqtt
  -> lighting controls enabled

source=artnet
  -> lighting controls disabled in Blue Whale
  -> clear ART-NET indication
  -> Source selector remains enabled
```

PASS: UI всегда соответствует factual DMXWB Source.

## JS-09 — Integrated Web reconnect / offline state

Финализировать общую реакцию интерфейса на:

- temporary Wi‑Fi loss;
- MQTT reconnect;
- unavailable WB/DMXWB states;
- page reload.

Не вводить лишнюю enterprise security model.

PASS: после восстановления связи Web возвращается к factual state без ручной перезагрузки там, где это технически разумно.

---

# SPRINT FINAL — End-to-End Integration / Acceptance

## FINAL-01 — Full conference room acceptance

Проверить на реальном оборудовании:

- setpoint;
- metrics;
- fan coil general control;
- 7 individual fan coils;
- ventilation;
- airing/restore;
- lighting fixture/group;
- RGBW controls;
- scenes;
- WB MQTT/ART-NET source switching;
- Web disabled lighting state при ART-NET;
- reconnect;
- iPad Safari UX;
- offline operation.

PASS: пользователь принимает систему целиком для эксплуатации в зале.

## FINAL-02 — Deployment/documentation completion

Зафиксировать:

- фактический путь установки Web на WB;
- фактический способ установки WB Rules;
- нужные local assets;
- backup/update procedure;
- troubleshooting notes;
- финальные screenshots/описания при необходимости.

PASS: проект можно повторно установить/восстановить по документации без воспроизведения истории разработки.

