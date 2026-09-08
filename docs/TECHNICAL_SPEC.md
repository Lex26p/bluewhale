# Blue Whale — техническое задание

**Статус документа:** согласованная рабочая продуктовая спецификация нового проекта  
**Дата основания:** 2026-09-08  
**Проект:** конференц-зал «Синий кит»  
**Центральный контроллер:** Wiren Board  
**Основной пользовательский терминал:** iPad в зале  
**Основной Web stack:** HTML / CSS / JavaScript  

---

## 1. Назначение системы

Blue Whale — локальная система пользовательского управления инженерными функциями конференц-зала «Синий кит» на базе Wiren Board.

Пользователь должен с одного настенного/стационарного iPad получать быстрый и понятный доступ к:

- температурной уставке;
- фактической температуре помещения;
- влажности;
- CO₂;
- общему управлению фанкойлами;
- индивидуальному включению/выключению каждого фанкойла;
- вентиляции;
- сценарию проветривания;
- RGBW-освещению;
- световым группам/зонам;
- сценам освещения;
- переключению источника управления DMX между WB MQTT и ART-NET.

Blue Whale не является универсальной SCADA и не предназначен для управления произвольным зданием. Это специализированный интерфейс и набор автоматизаций конкретного конференц-зала.

## 2. Основные архитектурные принципы

### 2.1. Wiren Board является центром системы

Wiren Board выполняет роль локального контроллера, к которому подключено инженерное оборудование и на котором работают необходимые сервисы/правила.

### 2.2. Web является пользовательским интерфейсом

Web не должен становиться главным automation engine.

Его задача:

- показывать состояние;
- принимать пользовательские команды;
- передавать команды через согласованный локальный API/MQTT;
- предоставлять touch-friendly UX.

Если iPad выключен, Safari закрыт или Wi‑Fi временно потерян, автоматизация оборудования не должна зависеть от открытой страницы.

### 2.3. Автоматизация климата — WB Rules

Фанкойлы, вентиляция и сценарий проветривания автоматизируются правилами/скриптами Wiren Board.

WB Rules должны быть владельцем:

- логики режимов;
- таймеров;
- сохранения/восстановления состояния;
- взаимных зависимостей;
- преобразования пользовательских high-level commands в физические реле/Modbus команды.

### 2.4. DMX lighting — DMXWB

Физический DMX512, Art-Net и MQTT модель RGBW-светильников предоставляются существующим отдельным проектом:

```text
https://github.com/Lex26p/DMXWB
```

Blue Whale использует DMXWB как внешнюю подсистему и не дублирует его physical DMX implementation.

## 3. Общая архитектура

```text
                         iPad / desktop browser
                          Blue Whale Web UI
                      HTML + CSS + JavaScript
                                |
                                | local MQTT WebSocket
                                v
                           Wiren Board
                                |
        +-----------------------+-----------------------+
        |                                               |
      WB Rules                                         DMXWB
        |                                               |
        |                                      +--------+--------+
        |                                      |                 |
        v                                      v                 v
 Fan coil relay outputs                  WB MQTT model       Art-Net input
        |                                      \                 /
        v                                       \               /
     Fan coils                                    DMX Source
                                                     |
 Ventilation Modbus                                  v
        |                                         DMX512
        v                                            |
 Ventilation unit                                 RGBW lights
```

## 4. Web technology requirements

### 4.1. Mandatory

Web должен быть основан на:

```text
HTML
CSS
JavaScript
```

### 4.2. Runtime

Production Web должен работать без внешнего Internet.

Запрещено полагаться на runtime загрузку:

- CDN CSS;
- CDN JavaScript;
- Google Fonts;
- remote icons;
- remote APIs, не являющиеся частью локальной системы.

### 4.3. Third-party libraries

Разрешается использовать локально хранимую библиотеку, если она действительно упрощает реализацию и соответствует требованиям Safari/iPad.

Подключение каждой внешней библиотеки должно быть осознанным. Не вводить framework только ради удобства разработки пары controls.

### 4.4. Build

На текущем этапе проект должен оставаться пригодным для прямого статического размещения без обязательного npm/build pipeline.

## 5. Target browser / touch UX

### 5.1. Primary target

Основной target — iPad Safari в landscape orientation.

### 5.2. Desktop preview

Desktop browser используется для разработки, просмотра и диагностики, но **не является отдельной адаптивной целью дизайна**.

**Decided:** основной layout проектируется как фиксированный планшетный canvas `1024×768` в landscape. На экранах шире/выше этого размера интерфейс не должен растягиваться, перераспределять колонки или увеличивать типографику: тот же планшетный canvas просто отображается по центру/в пределах desktop viewport.

Адаптация под большие desktop-мониторы не требуется. Если в будущем будет нужен другой tablet size, это рассматривается как отдельная явная ревизия UI-базы, а не как автоматическое fluid/responsive масштабирование.

### 5.3. Touch requirements

UI обязан:

- иметь крупные touch targets;
- не требовать hover;
- не требовать точного попадания мышью;
- не использовать мелкие технические controls на главном экране;
- корректно обрабатывать tap/drag на слайдерах;
- не провоцировать случайное выделение текста при обычном управлении;
- быть рассчитанным на фиксированный tablet canvas `1024×768` в landscape;
- не растягивать layout на больших desktop-экранах;
- обеспечивать понятное active/disabled состояние.

## 6. Visual direction

Новый Web создаётся с нуля и не должен копировать старую верстку.

Разрешено использовать старый интерфейс как visual reference.

Согласованное направление:

- светлый нейтральный фон;
- белые или визуально лёгкие cards;
- крупная типографика ключевых значений;
- минимум технического шума;
- один понятный accent color для selected/active state;
- удобная иерархия: важные команды заметны, вторичные данные не конкурируют с ними;
- на основном экране желательно видеть основные системы без длинной навигации.

Управление температурной уставкой должно визуально оставаться близким по идее к старому Blue Whale: крупная setpoint value и горизонтальная шкала.

## 7. Room climate data

Web должен отображать как минимум:

```text
Temperature
Humidity
CO₂
```

Точные MQTT sources и единицы данных будут определены при разработке WB Rules/JS integration.

Если конкретный датчик временно недоступен, Web не должен показывать выдуманное значение. Финальное поведение состояния unavailable будет определено в JS sprint.

## 8. Temperature setpoint

### 8.1. User requirement

Температурная уставка — один из главных controls интерфейса.

### 8.2. UI concept

Предпочтительный UX:

- крупное текущее значение setpoint;
- горизонтальная шкала;
- изменение пальцем tap/drag;
- читаемые основные деления;
- очевидный feedback при изменении.

### 8.3. Deferred details

До соответствующего шага не фиксируются произвольно:

- minimum;
- maximum;
- step (`0.5 °C`, `1 °C` или другой);
- политика округления.

Эти параметры должны соответствовать реальной климатической логике.

## 9. Fan coil subsystem

### 9.1. Physical connection

Фанкойлы управляются через обычные многоканальные реле, подключённые к Wiren Board ecosystem.

Web не должен знать номера физических relay outputs.

### 9.2. General control

На основном экране должен быть общий блок фанкойлов.

Конкретные high-level controls будут окончательно согласованы в `WEB-04` и затем реализованы в WB Rules/JS.

Ожидаемые категории управления:

- включение/выключение;
- режим;
- скорость;
- Auto, если он входит в итоговую логику.

### 9.3. Individual control

В зале 7 фанкойлов.

Должен быть отдельный экран/панель с пространственным расположением этих 7 фанкойлов относительно помещения.

Для одного конкретного фанкойла пользователь может только:

```text
ON
OFF
```

Индивидуальная температура/скорость для конкретного фанкойла в текущем scope не требуется.

## 10. Ventilation subsystem

### 10.1. Physical integration

Вентиляционная установка подключена по Modbus.

Web не должен напрямую работать с её raw Modbus registers.

### 10.2. Responsibility

WB Rules/Wiren Board layer должен предоставить Web понятные high-level states/commands.

### 10.3. UI

На основном экране вентиляция отображается отдельным блоком.

Финальный набор controls может включать:

- power;
- mode;
- speed;
- Auto;
- factual state.

Точный contract должен быть определён по фактическому оборудованию, а не копирован вслепую из старого проекта.

## 11. Airing scenario («Проветривание»)

### 11.1. Назначение

Проветривание — отдельный временный режим быстрого интенсивного климатического воздействия.

### 11.2. Required sequence

При запуске:

```text
1. сохранить предыдущее состояние затрагиваемых систем;
2. включить fan coils на максимальный режим/скорость;
3. включить ventilation на максимум;
4. установить минимальную температурную уставку;
5. запустить заданный таймер;
6. показать активный режим в Web;
7. после таймера восстановить предыдущее состояние.
```

### 11.3. Timer

Пользователь должен иметь возможность задавать/изменять длительность проветривания с iPad.

### 11.4. Runtime ownership

Таймер и restore logic выполняются на Wiren Board, не в браузере.

Закрытие Web не должно отменять или ломать активный сценарий.

## 12. Lighting subsystem

### 12.1. Physical technology

Освещение целевого зала будет RGBW и управляться через DMX512 посредством DMXWB.

### 12.2. Selection model

Web должен позволять выбрать:

- отдельный Fixture;
- группу/зону;
- при необходимости «весь зал» как группу верхнего уровня.

Предпочтительный UX — пространственный план помещения, а не только текстовый список.

### 12.3. Fixture/group controls

Пользовательские controls должны быть user-friendly и соответствовать доступному DMXWB contract.

Ожидаемые возможности:

- Power;
- RGB color;
- Brightness;
- управление белой составляющей/Temperature в рамках DMXWB;
- быстрые presets, если они будут согласованы.

Raw R/G/B numeric controls `0..255` не обязаны постоянно отображаться обычному пользователю на iPad.

## 13. DMXWB integration contract relevant to Blue Whale

Перед реальной интеграцией этот раздел должен сверяться с актуальным `Lex26p/DMXWB`.

### 13.1. Web transport

DMXWB использует MQTT WebSocket:

```text
/mqtt
```

### 13.2. System status/source

Known topics:

```text
/devices/dmxwb/controls/status
/devices/dmxwb/controls/source
/devices/dmxwb/controls/source/on
```

Known Source values:

```text
mqtt
artnet
```

Displayed meaning:

```text
mqtt   -> WB MQTT
artnet -> ART-NET
```

### 13.3. Fixture

Device pattern:

```text
/devices/dmxwb_fixture_<id>/
```

Command pattern:

```text
/devices/dmxwb_fixture_<id>/controls/<control>/on
```

Known controls:

```text
power
red
green
blue
color
brightness
temperature
reset
```

### 13.4. Group

Device pattern:

```text
/devices/dmxwb_group_<id>/
```

Command pattern:

```text
/devices/dmxwb_group_<id>/controls/<control>/on
```

Group commands применяются DMXWB к участникам группы.

### 13.5. Runtime/config snapshots

Known topics:

```text
/dmxwb/config
/dmxwb/state
/dmxwb/status
/dmxwb/config/result
```

### 13.6. Scene lifecycle

Known topics:

```text
/dmxwb/scenes/create
/dmxwb/scenes/<scene_id>/rename
/dmxwb/scenes/<scene_id>/apply
/dmxwb/scenes/<scene_id>/overwrite
/dmxwb/scenes/<scene_id>/delete
```

Scene lifecycle использует `request_id` и correlated result в `/dmxwb/config/result` согласно DMXWB contract.

## 14. DMX Source behavior in Blue Whale Web

### 14.1. WB MQTT selected

Если factual Source:

```text
mqtt
```

то Blue Whale разрешает обычное пользовательское управление освещением.

### 14.2. ART-NET selected

Если factual Source:

```text
artnet
```

то Blue Whale:

- явно показывает, что активен ART-NET;
- визуально деактивирует/блокирует controls света;
- не отправляет lighting control commands из этих UI controls;
- оставляет доступным Source selector для возврата к WB MQTT.

### 14.3. Scope boundary

Blue Whale **не обязан** запрещать DMXWB принимать MQTT commands от других клиентов.

Не требуется:

- менять DMXWB backend;
- вводить глобальный MQTT ACL;
- блокировать штатный WB Web;
- контролировать сторонние MQTT clients.

Это локальный пользовательский UI, и задача состоит только в корректном поведении самого Blue Whale.

## 15. Lighting scenes UX

Blue Whale должен поддерживать DMXWB scene lifecycle.

Пользователь должен иметь возможность:

- применить сцену;
- создать сцену из текущего WB MQTT состояния;
- переименовать сцену;
- перезаписать сцену текущим состоянием;
- удалить сцену.

Деструктивные операции могут требовать простого подтверждения в UI, но интерфейс не должен быть перегружен enterprise/security процедурами.

## 16. Connectivity and factual state

Финальный JS Web должен отличать:

- визуальное нажатие пользователя;
- успешный publish;
- factual state, полученный от Wiren Board/DMXWB.

Однако проект не должен обрастать защитами, не соответствующими локальной доверенной среде.

Необходимо разумное поведение при reconnect и unavailable state, но без попытки строить отдельную security/transaction platform.

Для DMXWB при интеграции следует учитывать его существующий MQTT state/confirmation contract вместо изобретения параллельного механизма.

## 17. Old project policy

Старый Blue Whale используется только для понимания:

- функций;
- исторической логики;
- визуальных предпочтений;
- структуры помещения;
- уже существующего UX.

Новый репозиторий не должен наследовать старую архитектуру только ради экономии времени.

Допускается заново реализовать похожий control, если его UX специально принят пользователем (например, setpoint scale).

## 18. Non-goals

В текущий scope не входят:

- облачная платформа;
- Internet service;
- пользовательские аккаунты/роли;
- сложная authentication модель;
- SCADA общего назначения;
- мобильное приложение App Store;
- React/Vue/Angular как обязательное требование;
- Node.js runtime на Wiren Board;
- npm build pipeline как обязательная часть deployment;
- Docker;
- прямой Modbus из browser;
- прямой DMX serial из browser;
- автоматизация здания, выполняемая только пока открыт iPad;
- переписывание DMXWB внутри Blue Whale;
- перенос старого кода в новый проект.

## 19. Проектируемая структура репозитория

После начала Web-реализации ожидается примерно такая структура:

```text
bluewhale/
    AGENTS.md
    README.md

    docs/
        TECHNICAL_SPEC.md
        ROADMAP.md
        PROJECT_STATE.md

    index.html

    css/
        app.css

    js/
        app.js
        ... future modules ...

    assets/
        icons/
        fonts/
        ... local static assets ...

    wb-rules/
        ... future Wiren Board scripts ...
```

Структура может уточняться по мере разработки, но изменение должно быть явным и отражённым в документации.

## 20. Acceptance philosophy

Разработка выполняется небольшими проверяемыми шагами.

Для UI главным PASS является не «код написан», а пользовательское принятие расположения и поведения.

Для WB Rules PASS требует фактической проверки логики на Wiren Board/оборудовании либо согласованном test setup.

Для JS integration PASS требует подтверждения реального end-to-end взаимодействия с factual MQTT states.

Финальная система должна быть понятной пользователю переговорной, а не только технически корректной разработчику.

