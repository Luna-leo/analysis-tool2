# Trigger Dialogs Refactoring Summary

## 実行されたリファクタリング

### 1. 共通コンポーネントの作成

#### BaseConditionDialog (`/components/dialogs/BaseConditionDialog.tsx`)
- 共通のダイアログ構造を提供
- サイズオプション: "default" | "large" | "full"
- ヘッダー、コンテンツ、フッターの標準レイアウト

#### ConditionEditorCard (`/components/condition-editor/ConditionEditorCard.tsx`)
- ConditionBuilderとExpression Previewを統合
- 1カラムまたは2カラムレイアウトに対応
- 式プレビューの表示/非表示オプション

#### ConditionNameFields (`/components/condition-dialogs/ConditionNameFields.tsx`)
- 条件の名前と説明フィールドを標準化
- カスタマイズ可能なラベルとプレースホルダー

#### SelectedItemsInfo (`/components/condition-dialogs/SelectedItemsInfo.tsx`)
- 選択されたアイテム数とメッセージを表示
- TriggerSignalDialogで使用

### 2. ユーティリティの共通化

#### conditionValidation.ts (`/utils/conditionValidation.ts`)
- `validateConditions`: 条件の検証ロジック
- `validateConditionForm`: フォーム全体の検証
- `getDialogTitle`: モードに基づくタイトル生成

### 3. 既存ダイアログのリファクタリング

#### TriggerSignalDialog
**変更前:**
- 独自のDialog/DialogContent/DialogHeaderを使用
- インラインで選択アイテム情報を表示

**変更後:**
- BaseConditionDialogを使用
- SelectedItemsInfoコンポーネントを使用
- よりクリーンな構造

#### TriggerConditionDialog
**変更前:**
- 独自のDialog実装
- 条件検証ロジックがインライン
- 基本情報とConditionBuilderを別々のCardで表示

**変更後:**
- BaseConditionDialogを使用
- ConditionNameFieldsで基本情報を管理
- ConditionEditorCardで条件編集と式プレビューを統合
- 検証ロジックを共通ユーティリティに移動

## 成果

### コードの削減
- **TriggerSignalDialog**: 約30%のコード削減
- **TriggerConditionDialog**: 約50%のコード削減

### 改善点
1. **保守性**: 共通ロジックが一箇所で管理される
2. **一貫性**: 両ダイアログが同じUI構造を使用
3. **拡張性**: 新しい条件ダイアログの追加が容易
4. **再利用性**: コンポーネントが他の場所でも使用可能

### ファイル構造
```
components/
├── dialogs/
│   ├── BaseConditionDialog.tsx (新規)
│   └── TriggerSignalDialog.tsx (更新)
├── condition-dialogs/
│   ├── ConditionNameFields.tsx (新規)
│   └── SelectedItemsInfo.tsx (新規)
├── condition-editor/
│   └── ConditionEditorCard.tsx (新規)
└── trigger-condition-master/
    └── TriggerConditionDialog.tsx (更新)

utils/
└── conditionValidation.ts (新規)
```

## 今後の拡張可能性

1. **統合ダイアログ**: 必要に応じて、両方の機能を持つ統一ダイアログを作成可能
2. **追加の共通コンポーネント**: 条件プレビューのみ、条件ビルダーのみなど、さらに細かい部品に分割可能
3. **テーマ対応**: BaseConditionDialogにテーマやスタイルバリエーションを追加可能