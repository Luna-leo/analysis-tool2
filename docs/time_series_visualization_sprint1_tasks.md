# Sprint #1 Task Breakdown — Time Series Visualization (TypeScript / WASM)

| US | Task ID | Task Description | Est. Hours | Main Tech / Notes |
|----|---------|------------------|-----------|-------------------|
| **US-2** CSV/ZIP Import |
| 2-1 | ZipWorker | ZIP 展開 & CSV 検出ユーティリティ (WebWorker) | 2 | @zip.js/zip.js |
| 2-2 | CsvToArrow | CSV ストリーム → Arrow Table 変換 | 2 | PapaParse + Apache Arrow JS |
| 2-3 | DuckInit | DuckDB-Wasm 初期化 & IndexedDB 永続化 | 2 | duckdb-wasm |
| 2-4 | BulkInsert | Arrow → DuckDB copy_arrow + 進捗ログ | 2 | duckdb-wasm |
| 2-5 | DupCheck | 重複 PK 検知 SQL & ログ出力 | 2 | duckdb-wasm |
| 2-6 | ImportTests | ユニットテスト & CLI smoke test | 2 | Vitest |
| **US-4** Axis & Series Selection UI |
| 4-1 | SensorAPI | センサ一覧取得 (SELECT DISTINCT) | 2 | duckdb-wasm |
| 4-2 | ParamPicker | React パラメータ選択 UI (検索付き) | 2 | TS / React / MUI |
| 4-3 | AxisLogic | 軸割付ロジック (単位検知 + 任意第2軸) | 2 | TypeScript |
| 4-4 | ConfigSave | 設定保存 (IndexedDB / localStorage) | 2 | TypeScript |
| 4-5 | UIValidate | Storybook & Playwright E2Eテスト | 2 | Storybook / Playwright |
| **US-3** High‑Perf Plotting |
| 3-1 | PlotPoC | uPlot vs regl-line2 ベンチマーク | 2 | TypeScript |
| 3-2 | BaseChart | ベースラインチャート実装 (uPlot) | 4 | TypeScript / uPlot |
| 3-3 | DownSample | LTTB / windowing ダウンサンプリング | 2 | TypeScript |
| 3-4 | PanZoomFPS | ズーム＆パン 60 fps チューニング | 4 | requestAnimationFrame |
| 3-5 | PerfBench | Playwright + perf API ベンチスクリプト | 2 | Node |
| **Shared** |
| SH-1 | CodeReview | PR レビュー & リファクタ | 4 | — |

**Total Estimated Hours: 40**

---

## Definition of Done (DoD)

* **Green tests** (Vitest + Playwright) pass in CI.
* **Code formatted** (`eslint`, `prettier`, `ruff` etc.) and reviewed.
* **Performance targets met**:  
  * Import 1 GB in ≤10 min.  
  * Initial plot of 1 M points in ≤3 s, zoom/pan ≥60 fps.
* **Storybook demos** updated for UI components.
* **No regressions** in existing functionality.

---

## GitHub Projects Setup

1. Create a new project board **“TSV Sprint 1 – Jul 2025”** with columns:  
   * Backlog → Ready → In Progress → Review → Done
2. Add each task card using the IDs above.
3. Link PRs to cards for automatic status updates.
