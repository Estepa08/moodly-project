# План реорганизации Dashboard

## Текущая структура (сверху вниз)

1. **PeriodSelector** — переключатель периода
2. **CollapsibleSection «Практики»** (PracticeProgress + ссылка "Все практики")
3. **QuickEntryIcons** — быстрая запись (Mood, Anxiety, Sleep, Energy)
4. **CollapsibleSection «Как вы себя чувствовали»** (ParameterTrendsChart → WellbeingCard → "Все отчёты")

## Проблемы

### 1. Опыт за практики на Dashboard
`PracticeProgress` дублирует `/progress` (ProgressPage), где есть герой, статус криттера, ачивки, миссии, коллекция питомцев — вся геймификация.

### 2. Быстрая запись
- Находится на Dashboard, но логичнее — после ежедневного чек-ина (когда юзер уже открыл приложение)
- Зелёный акцент (`border-l-accent`) — ок, но блок загромождает статистику

### 3. 5-й переключатель под графиком на английском
- `ParameterTrendsChart` рендерит кнопки-переключатели для каждого `paramNames`
- Если сервер возвращает >4 параметров (или кастомный), у 5-го нет ключа в `PARAM_NAME_KEYS`
- Падение: `t(PARAM_NAME_KEYS[name] ?? name)` → `t("CustomStress")` → возвращает ключ (англ.)
- **Нужно**: добавить недостающий ключ в `PARAM_NAME_KEYS` ИЛИ использовать `getFallback` / `defaultValue`

### 4. Место WellbeingCard
- Сейчас задвинут в конец CollapsibleSection с трендами
- Должен быть наверху, как ключевая метрика

### 5. Guideline-нарушения
| Файл | Строка | Проблема |
|------|--------|----------|
| `ParameterTrendsChart.tsx` | 97 | `<th>Date</th>` — hardcoded, не через `t()` |
| `PracticeProgress.tsx` | 119-121 | `toLocaleDateString(undefined, ...)` — не учитывает `i18n.language` |
| `dashboard.tsx` | — | Нет ссылки на `/progress` с Dashboard |
| `QuickEntryIcons.tsx` | 133-138 | Числа 0-10 под слайдером — hardcoded, не через `Intl.NumberFormat` |

## Варианты нового Dashboard

### Вариант A — «Только статистика»
```
PeriodSelector
─────────────────────
WellbeingCard          ← перемещён наверх
─────────────────────
ParameterTrendsChart   ← графики + переключатели
  └─ toggle buttons
  └─ "Все отчёты"
─────────────────────
```

**Изменения:**
- Удалить `CollapsibleSection «Практики»` + `PracticeProgress`
- Удалить `QuickEntryIcons`
- WellbeingCard — на верх, без CollapsibleSection
- ParameterTrendsChart остаётся раскрытым
- Добавить ссылку `/progress` в навигацию (уже есть в BottomNav, но добавить текстовую ссылку или карточку)

### Вариант B — «Статистика + ссылка на прогресс»
```
PeriodSelector
─────────────────────
WellbeingCard
  └─ "Прогресс →"     ← новая ссылка
─────────────────────
ParameterTrendsChart
  └─ toggle buttons
  └─ "Все отчёты"
─────────────────────
MiniProgressCard       ← компактный виджет XP/уровень
  └─ "Полный прогресс →"
```

**Изменения:**
- Всё как в A
- Добавить компактный `PracticeProgressMini` (только уровень + XP) или ссылку

### Вариант C — «Быстрая запись после чек-ина»
```
PeriodSelector
─────────────────────
WellbeingCard
─────────────────────
ParameterTrendsChart
  └─ "Все отчёты"
─────────────────────
```

+ **QuickEntryIcons** переносится:
  - В модалку после `DailyCheckInModal`
  - Или на страницу `/practices` как быстрый entry-point
  - Или в новую секцию на `/practices`

## Порядок реализации

1. **SVG-макеты** — нарисовать 3 варианта в `docs/` и показать пользователю
2. **Выбор варианта** — уточнить у пользователя
3. **Фикс i18n 5-й кнопки** — добавить ключ или fallback
4. **Фикс hardcoded Date** — обернуть `t("common.date")`
5. **Реорганизация Dashboard** — переместить WellbeingCard, убрать лишнее
6. **Перенос QuickEntry** — после чек-ина или в практики
7. **Добавить ссылку на /progress** — если вариант B
8. **Фикс toLocaleDateString** — передавать `i18n.language`
