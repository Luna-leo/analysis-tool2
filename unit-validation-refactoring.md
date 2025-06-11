# Unit Validation Feature Refactoring

## 概要
単位検証とunit conversion機能のリファクタリングを実施し、コードの可読性、保守性、再利用性を向上させました。

## リファクタリング内容

### 1. Custom Hook の分離
**ファイル**: `hooks/useUnitValidation.ts`
- Unit validation logic を独立したカスタムフックに分離
- YAxisGroupコンポーネントから複雑なlogicを切り出し
- 再利用可能で、テストしやすい構造に変更

**メリット**:
- コンポーネントの責務が明確化
- 単体テストが容易
- 他のコンポーネントでも再利用可能

### 2. Unit Mismatch Alert コンポーネントの分離
**ファイル**: `components/charts/EditModal/parameters/UnitMismatchAlert.tsx`
- 警告アラート部分を独立したコンポーネントに分離
- 単位不整合の表示ロジックとUI を分離
- Convert All ボタンと新規換算式作成ボタンを含む

**メリット**:
- 関心の分離（警告表示 vs Y軸グループ管理）
- 再利用可能なコンポーネント
- YAxisGroupコンポーネントの簡素化

### 3. Unit Selector コンポーネントの分離
**ファイル**: `components/charts/EditModal/parameters/UnitSelector.tsx`
- Parameter単位選択ロジックを独立したコンポーネントに分離
- 単位変換ダイアログとの連携機能を含む
- 換算状態の視覚的表示（→アイコン）

**メリット**:
- ParameterRowコンポーネントの簡素化
- 単位選択機能の独立テスト
- 他の場所での再利用が可能

### 4. 型定義の整理
**変更点**: 
- `UnitValidationResult` 型を `types/index.ts` に移動
- 各ファイルで一貫した型importを使用
- 型定義の一元管理

**メリット**:
- 型定義の重複排除
- 一貫した型使用
- 型の変更時の影響範囲の明確化

## アーキテクチャ構造

```
YAxisGroup
├── useUnitValidation (カスタムフック)
├── UnitMismatchAlert (警告表示)
├── ParameterRow
│   └── UnitSelector (単位選択)
└── その他のUI要素
```

## ファイル構成の変更

### 新規作成ファイル
- `hooks/useUnitValidation.ts` - Unit validation ロジック
- `components/charts/EditModal/parameters/UnitMismatchAlert.tsx` - 警告アラート
- `components/charts/EditModal/parameters/UnitSelector.tsx` - 単位選択UI

### 変更されたファイル
- `components/charts/EditModal/parameters/YAxisGroup.tsx` - 大幅に簡素化
- `components/charts/EditModal/parameters/ParameterRow/index.tsx` - 単位関連ロジック削除
- `types/index.ts` - 型定義追加
- `utils/unitValidation.ts` - 型定義削除、importパス変更

## コードメトリクス改善

### Before (リファクタリング前)
- YAxisGroup.tsx: ~300行 (複雑なunit validation logic含む)
- ParameterRow/index.tsx: ~320行 (unit selector logic含む)

### After (リファクタリング後)
- YAxisGroup.tsx: ~253行 (45行削減)
- ParameterRow/index.tsx: ~144行 (176行削減)
- 新規コンポーネント: 3ファイル (~300行追加)

**結果**: コードが論理的に分離され、各ファイルの責務が明確化

## 保守性向上のポイント

1. **単一責任の原則**: 各コンポーネントが明確な責務を持つ
2. **関心の分離**: UI表示とロジックの分離
3. **再利用性**: 独立したコンポーネントとフック
4. **テスタビリティ**: 各機能の独立テストが可能
5. **型安全性**: 一元化された型定義

## 今後の拡張性

- UnitSelectorコンポーネントは他のパラメータ選択場面で再利用可能
- useUnitValidationフックは他の軸（X軸など）でも利用可能
- UnitMismatchAlertは他の不整合検出場面で再利用可能

このリファクタリングにより、機能追加や修正時の影響範囲が明確になり、保守性が大幅に向上しました。