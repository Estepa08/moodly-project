# План: удаление страницы /reports и перенос дайджеста на Dashboard

## 1. Удалить бэкенд-код reports

**Файлы для удаления:**
- `backend/src/routes/reports.ts` (256 строк — API endpoints)
- `backend/src/services/report.ts` (73 строки — сервис)
- `backend/src/routes/__tests__/reports.test.ts` (тесты бэкенда)

**Файлы для редактирования:**
- `backend/src/index.ts` — удалить `import reportRoutes` (строка 16) и `await fastify.register(reportRoutes)` (строка 63)
- `backend/src/test/helpers.ts` — удалить `import reportRoutes` (строка 13) и `await fastify.register(reportRoutes)` (строка 33)
- `backend/src/seed.ts` — удалить `await prisma.report.deleteMany()` (строка 579)

## 2. Удалить фронтенд-код reports

**Файлы для удаления:**
- `frontend/src/routes/reports.tsx` (364 строки — вся страница кроме WeeklyDigestTab)
- `frontend/src/routes/digest.tsx` (174 строки — устаревший дубликат)
- `frontend/src/hooks/useReports.ts` (34 строки — хук для создания/списка отчётов)
- `frontend/src/routes/__tests__/reports.test.tsx` (85 строк — тесты страницы)

**Файлы для редактирования:**

### App.tsx
- Удалить `const ReportsPage = lazy(() => import("./routes/reports"));` (строка 19)
- Удалить `<Route path="/reports" element={<ReportsPage />} />` (строка 90)
- Удалить `<Route path="/reports/weekly" element={<Navigate to="/reports?tab=weekly" replace />} />` (строка 97)
- Удалить `<Route path="/digest" element={<Navigate to="/reports?tab=weekly" replace />} />` (строка 106)

### frontend/src/lib/api.ts
- Удалить `type Report` (строка 20)
- Удалить `type ReportCreate` (строка 21)
- Удалить секцию `reports: { ... }` (строки 280-286)

### frontend/src/lib/api-types.ts
- Удалить схемы: `Report`, `ReportCreate`, `ReportFormat`, `ReportStatus`
- Удалить операции: `Reports_list`, `Reports_create`, `Reports_get`, `Reports_delete`, `Reports_download`
- Удалить пути: `/reports`, `/reports/{id}`, `/reports/{id}/download`

### frontend/src/layout/nav-config.ts
- Удалить импорт `FileText` (строка 10)
- Удалить `{ labelKey: "nav.reports", path: "/reports", icon: FileText }` (строка 43)

### frontend/src/components/ui/breadcrumbs.tsx
- Удалить `"/reports/weekly": "nav.weeklyDigest"` (строка 7)

### frontend/src/i18n/locales/{en,ru}/translation.json
- Удалить все ключи `reports.*` (17 ключей)
- Удалить ключ `reports` из секции `nav`
- Удалить ключ `nav.weeklyDigest`

## 3. Создать компонент WeeklyDigest для Dashboard

Новый файл: `frontend/src/widgets/WeeklyDigest.tsx`

Содержимое: извлечь `WeeklyDigestTab()` из `reports.tsx` + доработать:
- Импортировать `useWeeklyDigest` из `../hooks/useWeeklyDigest`
- Импортировать `DigestCharts` из `../features/analytics`
- Убрать зависимость от табов (нет переключения)
- Использовать те же i18n ключи `digest.*`

Основные секции:
1. Overview Card (4 метрики: totalEntries, checkInDays, xpGained, creatureLevel) — grid 2x2
2. `DigestCharts` (BarChart средних + PieChart практик)
3. Averages Card (grid 2x2 параметров)
4. Practices Card (grid 2x2 с иконками)
5. Tests Card (список)

Экспортировать как `{ WeeklyDigest }` из `frontend/src/widgets/index.ts`

## 4. Обновить Dashboard

### dashboard.tsx
- Импортировать `WeeklyDigest` из `../widgets`
- Добавить `<WeeklyDigest />` ПОСЛЕ секции с ParameterTrendsChart (после строки 67, перед ссылкой «Все отчёты»)
- Удалить ссылку «All reports» (строки 67-75) — `/reports` больше нет

### WellbeingCard.tsx
- Убрать `<Link to="/reports">` обёртку (строка 33)
- Оставить просто `<Card>` — карточка-статистика без перехода
- Удалить иконку `ArrowRight`
- Импорты: удалить `Link` из `react-router-dom`, удалить `ArrowRight` из `lucide-react`

## 5. Добавить недостающие i18n ключи

В `en/translation.json` и `ru/translation.json`:
- `digest.averagesChartTitle` — "Average Values" / "Средние значения"
- `digest.practicesChartTitle` — "Practices Completed" / "Выполнено практик"

## 6. SVG-макет

Нарисовать `docs/dashboard-layout-with-digest.svg` — Dashboard с новым блоком дайджеста внизу.

Порядок:
```
PeriodSelector
─────────────────
WellbeingCard (без ссылки)
─────────────────
Параметры (график + переключатели)
─────────────────
Недельная сводка (новый блок)
  ├─ Overview: 4 карточки метрик
  ├─ Графики: BarChart + PieChart
  ├─ Средние значения (карточки)
  ├─ Выполнено практик (карточки)
  └─ Пройдено тестов (список)
```

## 7. Проверка

- `tsc --noEmit` — 0 ошибок
- `eslint` — 0 ошибок
- `go build ./...` — бэкенд компилируется
