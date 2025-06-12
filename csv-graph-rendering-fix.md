# CSVグラフ描画問題の修正

## 問題の原因
1. **カラム名のスペース処理不整合**
   - CASSフォーマットのCSVファイルで、パラメータ名の前後にスペースが含まれていた
   - パーサーがスペースをトリムしていなかったため、データのキーとパラメータ選択時の名前が一致しなかった

2. **データマッピングの問題**
   - `mapCASSFormatToStandardized`関数で`Object.values(row)`を使用していたため、正しいパラメータ名でデータが保存されていなかった

## 実装した修正

### 1. CASSパーサーでのスペーストリム処理
```typescript
// utils/csvParsers/cassParser.ts
- パラメータ名、ID、単位をすべてトリム
- headers.push(paramRow[i].trim())
- parameterInfo内のデータもトリム
```

### 2. データマッピングの修正
```typescript
// utils/csvUtils.ts - mapCASSFormatToStandardized
- Object.values(row)の使用をやめ、ヘッダー名で直接アクセス
- parsedData.headers.forEach()を使用してデータを正しくマッピング
```

### 3. デバッグログの追加
- `getParameterData`でパラメータの検索状況をログ出力
- `extractParameterData`で見つからないパラメータを警告
- `ChartPreviewGraph`でデータ取得の失敗を警告

## テスト方法
1. CSVファイルをインポート（Shift-JIS、UTF-8両対応）
2. グラフ編集でY軸パラメータを選択
3. コンソールでデバッグ情報を確認
4. グラフが正しく描画されることを確認

これらの修正により、カラム名にスペースが含まれていても正しくデータが取得され、グラフが描画されるようになります。