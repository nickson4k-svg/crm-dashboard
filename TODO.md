# TODO

- [x] Update `ui-navi.js` `showAnalytics()`:

  - [ ] Change analytics grid to two columns (1fr 1fr) with gap 20px.
  - [ ] Keep existing Doughnut chart wrapper in left column.
  - [ ] Add right column wrapper for "AI Sales Forecast":
    - [ ] Add Generate AI Forecast button (id `generateAiBtn`).
    - [ ] Add `#aiInsightsContent` container with placeholder text.
- [x] Update `script.js`:
  - [ ] Add mock AI logic: click handler for `#generateAiBtn`.
  - [ ] Disable button + set analyzing state; clear `#aiInsightsContent` and show loading.
  - [ ] `setTimeout(2000)` simulate API call.
  - [ ] After 2s compute stats from `clients` (Demo total value and count, etc.).
  - [ ] Inject Smart Insight HTML into `#aiInsightsContent`.
  - [ ] Render new bar chart "Expected vs Actual Revenue" in `#aiInsightsContent`.
  - [ ] Re-enable button.
- [ ] Run a quick sanity check (build/run if applicable) and ensure existing Doughnut chart still works.

