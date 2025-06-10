# TriggerSignalDialog と TriggerConditionDialog のリファクタリング提案

## 現状分析

### TriggerSignalDialog.tsx
- **用途**: データソースアイテムにフィルター条件を適用
- **機能**: 
  - 事前定義条件と手動設定の切り替え
  - SearchConditionsSectionコンポーネントを使用
  - 条件の保存機能
  - useSearchConditionsフックを使用

### TriggerConditionDialog.tsx
- **用途**: トリガー条件マスターページで条件の作成/編集/複製
- **機能**:
  - 条件の名前と説明を編集
  - ConditionBuilderで条件を構築
  - 式のプレビュー表示
  - 作成/編集/複製モード

## 重複している機能

1. **ConditionBuilder の使用**
2. **条件式のフォーマットと表示** (formatConditionExpression, formatConditionExpressionToJSX)
3. **条件の検証ロジック**
4. **ExpressionLegend の表示**
5. **ダイアログのレイアウト構造**

## リファクタリング戦略

### 戦略1: 共通コンポーネントの抽出（推奨）

#### 1. ConditionEditorCard コンポーネントの作成
```tsx
interface ConditionEditorCardProps {
  conditions: SearchCondition[]
  onConditionsChange: (conditions: SearchCondition[]) => void
  showExpressionPreview?: boolean
  className?: string
}

export function ConditionEditorCard({
  conditions,
  onConditionsChange,
  showExpressionPreview = true,
  className
}: ConditionEditorCardProps) {
  return (
    <div className={className}>
      <ConditionBuilder
        conditions={conditions}
        onChange={onConditionsChange}
      />
      {showExpressionPreview && (
        <ExpressionPreview conditions={conditions} />
      )}
    </div>
  )
}
```

#### 2. ExpressionPreview コンポーネントの強化
現在のExpressionPreviewを拡張して、両方のダイアログで使用できるようにする：
```tsx
interface ExpressionPreviewProps {
  conditions?: SearchCondition[]
  conditionMode?: ConditionMode
  getCurrentExpressionJSX?: () => React.ReactNode
  showLegend?: boolean
  className?: string
}
```

#### 3. BaseConditionDialog コンポーネントの作成
共通のダイアログ構造を提供：
```tsx
interface BaseConditionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  size?: "default" | "large" | "full"
  children: React.ReactNode
  footer?: React.ReactNode
}
```

### 戦略2: 統合ダイアログの作成

#### UnifiedConditionDialog の作成
両方の機能を持つ統一されたダイアログ：
```tsx
interface UnifiedConditionDialogProps {
  mode: "apply" | "create" | "edit" | "duplicate"
  
  // Apply mode props
  selectedDataSourceItems?: EventInfo[]
  onApplyConditions?: (conditions: SearchCondition[]) => void
  
  // Create/Edit mode props
  initialCondition?: PredefinedCondition
  onSaveCondition?: (condition: PredefinedCondition) => void
  
  // Common props
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

### 戦略3: Composition パターンの使用

#### 基本的なビルディングブロックを作成
```tsx
// components/condition-dialogs/blocks/
- ConditionNameFields.tsx      // 名前と説明のフィールド
- ConditionBuilderSection.tsx  // 条件ビルダーセクション
- ExpressionPreviewSection.tsx // 式プレビューセクション
- ConditionModeSelector.tsx    // 事前定義/手動切り替え
- SelectedItemsInfo.tsx        // 選択アイテム情報表示
```

## 推奨実装手順

### Phase 1: 共通コンポーネントの抽出（1-2日）
1. `ConditionEditorCard` コンポーネントを作成
2. `ExpressionPreview` を拡張して両方のユースケースに対応
3. 条件検証ユーティリティを共通化

### Phase 2: ダイアログのリファクタリング（2-3日）
1. `BaseConditionDialog` を作成
2. 既存のダイアログを新しい共通コンポーネントを使用するように更新
3. 重複コードを削除

### Phase 3: テストと最適化（1日）
1. 両方のダイアログの機能をテスト
2. パフォーマンスの最適化
3. ドキュメントの更新

## 期待される効果

1. **コードの重複を50%以上削減**
2. **保守性の向上** - 条件ビルダーの変更が一箇所で管理される
3. **一貫性の向上** - UIとUXが統一される
4. **拡張性** - 新しい条件ダイアログの追加が容易に

## 実装の優先順位

1. **高**: ConditionEditorCard の作成（最も再利用性が高い）
2. **中**: 条件検証ロジックの共通化
3. **低**: ダイアログ全体の統合（影響範囲が大きい）

## 注意点

- 既存の機能を壊さないよう段階的に実装
- 各ダイアログの固有の要件を維持
- TypeScriptの型定義を適切に管理