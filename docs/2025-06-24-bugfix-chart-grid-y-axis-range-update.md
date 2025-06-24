# Chart Grid Y-axis Range Update Fix

## Meta Information
- **Created**: 2025-06-24
- **Updated**: 2025-06-24
- **Category**: Bug Fix
- **Related Commits**: 95f0628
- **Affected Components**: 
  - `/hooks/useSharedDataCache.ts`
  - `/hooks/useOptimizedChart.ts`
  - `/components/charts/ChartEditModal.tsx`
  - `/components/charts/VirtualizedChartGrid.tsx`

## Overview
Chart GridのY軸レンジがY Parameter変更後も更新されない問題を修正しました。

## Details
### Background/Problem
- Y Parameterを変更してSaveボタンを押してModalを閉じても、Chart GridのY軸レンジが古いデータの範囲のまま
- Chart Preview（Edit Modal内）は正しく更新される
- ページをリロードすると正しく表示される（データは正しく保存されている）

### Implementation
1. **キャッシュキーの改善**
   - `useSharedDataCache`のキャッシュキーにyAxisParamsKeyを追加
   - Y Parameterの変更を検知できるように改善

2. **キャッシュクリア機能の追加**
   - `clearForDataSources`メソッドを追加
   - 特定のdataSourceIdに関連するキャッシュをクリア

3. **Save時のキャッシュクリア**
   - `ChartEditModal`でY Parameter変更を検知
   - 変更があった場合、関連するdataSourceのキャッシュをクリア

4. **強制再レンダリング**
   - `VirtualizedChartGrid`のkeyプロパティにY parametersを含める
   - Y Parameter変更時に確実に再レンダリング

### Technical Details
```typescript
// キャッシュキーの生成（yAxisParamsKeyを追加）
const getCacheKey = useCallback((periodId: string, parameters: string[], xAxisType?: string, yAxisParamsKey?: string): string => {
  const axisTypePrefix = xAxisType ? `${xAxisType}:` : ''
  const yAxisSuffix = yAxisParamsKey ? `:${yAxisParamsKey}` : ''
  return `${axisTypePrefix}${periodId}:${parameters.sort().join(',')}${yAxisSuffix}`
}, [])

// Y Parameter変更時のキャッシュクリア
if (oldYParams !== newYParams) {
  const dataSourceIds = selectedDataSourceItems.map(item => item.id)
  if (dataSourceIds.length > 0) {
    dataCache.clearForDataSources(dataSourceIds)
  }
}
```

## Usage
1. Chart GridでチャートのEditボタンをクリック
2. Y Parameterを変更
3. Saveボタンを押してModalを閉じる
4. Chart GridのY軸レンジが新しいデータに合わせて自動的に更新される

## Impact
- Chart GridとChart Previewの表示が常に同期される
- ページリロードが不要になり、ユーザー体験が向上
- キャッシュの管理が改善され、データの整合性が保たれる

## Testing
1. 開発サーバーでアプリケーションを起動
2. Chart Gridで任意のチャートを編集
3. Y Parameterを変更してSave
4. Chart GridのY軸レンジが更新されることを確認
5. デバッグログで以下のメッセージを確認：
   - `[ChartEditModal] Y parameters changed, clearing cache`
   - `[useSharedDataCache] Clearing cache for data sources: [...]`

## Future Improvements
- X Parameter変更時も同様の処理を追加することを検討
- キャッシュの有効期限をより細かく制御する仕組みの導入
- パフォーマンスモニタリングの追加