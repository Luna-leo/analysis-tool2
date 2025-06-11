# CSV Import Error 修正内容

## 問題の原因
1. **Shift-JISエンコーディング**: 実データがShift-JISでエンコードされているため、UTF-8として読み込むと文字化けが発生
2. **大文字小文字の区別**: ヘッダー検証で`Datetime`の大文字小文字を厳密に区別していた
3. **CASSフォーマットの検証**: 空のDatetimeヘッダーを考慮していなかった

## 実装した修正

### 1. Shift-JISエンコーディングのサポート追加
```typescript
// utils/csvUtils.ts
- 自動的にShift-JISを検出して適切にデコード
- 文字化けパターン（�）を検出してエンコーディングを判定
- UTF-8へのフォールバック機能
```

### 2. CSVバリデーションロジックの改善
```typescript
// utils/csvUtils.ts
- ヘッダーの大文字小文字を無視した比較
- CASSフォーマットで'datetime'または'time'を含む任意のカラムを許可
- より柔軟な検証ロジック
```

### 3. エラーメッセージの改善
```typescript
// components/charts/EditModal/data-source/DataSourceTab.tsx
- 検出されたヘッダーをエラーメッセージに表示
- コンソールに詳細なデバッグ情報を出力
```

## テスト方法
1. analysis-tool2を起動
2. グラフ編集画面でData Sourceタブを開く
3. Import CSVボタンをクリック
4. Shift-JISエンコードのCSVファイルを選択
5. Data Source TypeとしてCASSを選択
6. インポートが成功することを確認

これらの修正により、Shift-JISエンコードの実データも正しくインポートできるようになります。