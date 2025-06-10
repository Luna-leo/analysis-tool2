# Group "within group" 論理演算子の削除

## 変更内容
使用されていなかった「Group: AND/OR within group」の論理演算子選択機能を削除しました。

## 削除された部分

### 1. ConditionBuilder.tsx
**変更前:**
```tsx
<span className="text-sm font-medium">Group:</span>
<select
  value={condition.logicalOperator || 'AND'}
  onChange={(e) => updateCondition(condition.id, { 
    logicalOperator: e.target.value as 'AND' | 'OR' 
  })}
  className="w-20 h-7 px-2 border rounded text-sm"
>
  <option value="AND">AND</option>
  <option value="OR">OR</option>
</select>
<span className="text-xs text-muted-foreground">within group</span>
```

**変更後:**
```tsx
<span className="text-sm font-medium">Group</span>
<span className="text-xs text-muted-foreground">(Nested conditions)</span>
```

### 2. グループ作成時のlogicalOperator
- `addGroup`関数から`logicalOperator: 'AND'`を削除

### 3. predefinedConditions.ts
- 事前定義された条件からグループの`logicalOperator`を削除

## 理由
- このプロパティは実際の条件評価では使用されていなかった
- ユーザーの混乱を避けるため
- 条件間の論理演算は各条件の個別の`logicalOperator`で制御される

## 影響
- UIがよりシンプルになり、混乱が減る
- 実際の動作に変更はない（元々機能していなかったため）
- グループは純粋に条件をネストするための構造として機能する