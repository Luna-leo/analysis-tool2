# X軸パラメータタイプ切り替え時の範囲表示バグ修正

## メタ情報
- **作成日時**: 2025-06-22
- **更新日時**: 2025-06-22
- **分類**: Bug Fix
- **関連コミット**: 5f04be3
- **対象コンポーネント**: 
  - `hooks/useOptimizedChart.ts`
  - `components/charts/ChartPreview/ScatterPlot.ts`
  - `utils/chart/axisManager.ts`
  - `hooks/useSharedDataCache.ts`
  - `components/charts/EditModal/parameters/XParameterSettings/index.tsx`

## 問題の概要

### 症状
チャートのX軸タイプを「Datetime」から「Parameter」に切り替えた際、実際のデータ範囲（例：0-5）に関わらず、軸の範囲が0-100として表示される問題が発生していました。

### 影響範囲
- Chart Gridページでの表示（Chart Previewは正常に動作）
- パラメータタイプからDatetimeタイプに戻した際、Chart Grid上のプロットが消失
- Chart Gridに表示されるデータポイントが極端に少ない（2点のみ）

### 再現手順
1. チャートを作成し、X軸タイプを「Datetime」に設定
2. データを表示して正常に動作することを確認
3. Edit Modalを開き、X軸タイプを「Parameter」に変更
4. X軸のパラメータを選択（例：0-5の範囲のデータ）
5. Chart Gridページで軸範囲が0-100と表示される

## 原因分析

### 根本原因
`useOptimizedChart`フックがデータをキャッシュしており、X軸タイプを変更してもキャッシュされた古いデータ（Date型のx値）が再利用されていました。これにより：

1. Parameter型に切り替えても、x値がDate型のまま
2. ScatterPlot.tsがDate型の値をスキップ
3. axisManagerが有効な数値データを見つけられず、デフォルトの0-100を使用

### データフローの問題点
```
useOptimizedChart (データ生成)
  ↓ x値: Date型のまま
ScatterPlot (データ変換)
  ↓ Date型をスキップ
axisManager (軸範囲計算)
  → 有効なデータなし → 0-100
```

### Chart PreviewとChart Gridの動作差異
Chart Previewは即座に再レンダリングされるため、新しいデータで正しく表示されていましたが、Chart Gridは仮想化とキャッシュの影響で古いデータを使用し続けていました。

## 解決方法

### 実装した修正

1. **キャッシュキーにxAxisTypeを追加**
   ```typescript
   // useSharedDataCache.ts
   const getCacheKey = useCallback((periodId: string, parameters: string[], xAxisType?: string): string => {
     const axisTypePrefix = xAxisType ? `${xAxisType}:` : ''
     return `${axisTypePrefix}${periodId}:${parameters.sort().join(',')}`
   }, [])
   ```

2. **X軸タイプ変更時のキャッシュクリア**
   ```typescript
   // useOptimizedChart.ts
   useEffect(() => {
     if (prevXAxisTypeRef.current !== undefined && prevXAxisTypeRef.current !== xAxisType) {
       dataCache.clear()
       prevXAxisTypeRef.current = xAxisType
       setData([])
       setIsLoading(true)
     }
   }, [xAxisType, dataCache, editingChart.id])
   ```

3. **デバウンス処理の改善**
   ```typescript
   const loadData = useCallback(async () => {
     // データ読み込みロジック
   }, [依存配列])
   
   useEffect(() => {
     debouncedLoadDataRef.current = debounce(loadData, DATA_LOAD_DEBOUNCE_MS)
     debouncedLoadDataRef.current()
   }, [loadData])
   ```

4. **xParameterの適切な管理**
   ```typescript
   // XParameterSettings/index.tsx
   if (newAxisType === "datetime") {
     newXParameter = "timestamp"
   } else if (editingChart.xAxisType === "datetime" && newAxisType !== "datetime") {
     newXParameter = ""
   }
   ```

## 技術的詳細

### キャッシュメカニズムの改善
- キャッシュキーにxAxisTypeを含めることで、軸タイプごとに異なるキャッシュエントリを作成
- 軸タイプ変更時に全キャッシュをクリアして、確実に新しいデータを取得

### デバウンス処理の最適化
- useCallbackとuseEffectの組み合わせで、依存関係が変更されたときに新しいdebounced関数を作成
- 古いdebounced関数は適切にキャンセル

### リファクタリング内容
1. **デバッグログの環境依存化**
   - `process.env.NODE_ENV === 'development'`条件でログ出力を制御
   - 本番環境でのパフォーマンス向上

2. **定数の抽出**
   - `DATA_LOAD_DEBOUNCE_MS = 300`として定数化
   - マジックナンバーの排除

3. **コードの簡素化**
   - ScatterPlot.tsのデータ変換ロジックを大幅に簡素化
   - 不要なDate値チェックを削除

## 今後の改善点

### より根本的な解決策
1. **データ変換の一元化**
   - 現在、useOptimizedChart、ScatterPlot、axisManagerで重複したデータ変換が行われている
   - データ変換ロジックを一箇所に集約することで、一貫性を保証

2. **型安全性の向上**
   - xAxisTypeに応じたx値の型を厳密に定義
   - TypeScriptの型システムを活用して、実行時エラーを防止

3. **キャッシュ戦略の見直し**
   - より細かい粒度でのキャッシュ無効化
   - チャート設定変更時の選択的なキャッシュ更新

### パフォーマンス最適化
1. **不要な再レンダリングの削減**
   - React.memoとuseCallbackのより効果的な使用
   - 依存配列の最適化

2. **データ取得の最適化**
   - 必要なパラメータのみを取得
   - バッチ処理の改善

## 関連ドキュメント
- [型マイグレーションガイド](./type-migration-guide.md)
- [統一マージンシステム](./unified-margin-system.md)