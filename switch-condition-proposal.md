# スイッチON/OFF条件の実装提案

## 更新: 実装方針の変更
パラメータ名による自動判定ではなく、オペレータ選択に基づいて値入力欄の表示/非表示を制御するように変更しました。

## 概要
スイッチやバルブなどのON/OFF状態を検出する条件を直感的に設定できるUIを実装します。

## 新しいオペレータタイプ

### 1. 状態確認オペレータ
- `isOn`: パラメータがON（true/1）の状態
- `isOff`: パラメータがOFF（false/0）の状態

### 2. 状態変化検出オペレータ  
- `switchedOn`: OFF→ONに変化した瞬間を検出
- `switchedOff`: ON→OFFに変化した瞬間を検出

## UI設計

### A. パラメータタイプの識別
```typescript
interface ParameterInfo {
  name: string
  type: 'numeric' | 'boolean' | 'string'
  unit?: string
}

// パラメータマスターに型情報を追加
const parameterMaster: ParameterInfo[] = [
  { name: 'temperature', type: 'numeric', unit: '°C' },
  { name: 'pressure', type: 'numeric', unit: 'bar' },
  { name: 'pump_switch', type: 'boolean' },
  { name: 'valve_01_status', type: 'boolean' },
  // ...
]
```

### B. 条件ビルダーのUI改善

#### 1. オペレータ選択の動的表示
```typescript
// パラメータタイプに応じたオペレータのフィルタリング
const getAvailableOperators = (parameterType: string) => {
  if (parameterType === 'boolean') {
    return [
      { value: 'isOn', label: 'is ON' },
      { value: 'isOff', label: 'is OFF' },
      { value: 'switchedOn', label: 'switched ON' },
      { value: 'switchedOff', label: 'switched OFF' }
    ]
  } else {
    return [
      { value: 'gt', label: '>' },
      { value: 'gte', label: '>=' },
      { value: 'lt', label: '<' },
      { value: 'lte', label: '<=' },
      { value: 'eq', label: '=' },
      { value: 'ne', label: '!=' },
      { value: 'crossAbove', label: 'crosses above' },
      { value: 'crossBelow', label: 'crosses below' }
    ]
  }
}
```

#### 2. 値入力欄の条件付き表示
```tsx
// ブール型オペレータの場合は値入力欄を非表示
const showValueInput = (operator: string) => {
  return !['isOn', 'isOff', 'switchedOn', 'switchedOff'].includes(operator)
}

// UIコンポーネント内
{showValueInput(condition.operator) && (
  <Input
    placeholder="Value"
    value={condition.value || ''}
    onChange={(e) => updateCondition(index, { value: e.target.value })}
    className="w-24 h-8 text-sm"
  />
)}
```

### C. 条件式の表示改善

#### 現在の表示
```
pump_switch = 1
valve_01_status = 0
```

#### 改善後の表示
```
pump_switch is ON
valve_01_status is OFF
pump_switch switched ON
valve_01_status switched OFF
```

## 実装例

### 条件の例
```typescript
// ポンプが稼働中で、バルブが開いた瞬間を検出
{
  conditions: [
    {
      id: 'cond1',
      type: 'condition',
      parameter: 'pump_switch',
      operator: 'isOn',
      value: null  // ブール型オペレータでは値は不要
    },
    {
      id: 'cond2',
      type: 'condition',
      parameter: 'valve_01_status',
      operator: 'switchedOn',
      value: null,
      logicalOperator: 'AND'
    }
  ]
}
```

### 表示される条件式
```
pump_switch is ON AND valve_01_status switched ON
```

## 実装手順

1. **型定義の更新**
   - `OperatorType`に新しいオペレータを追加
   - パラメータ情報の型定義を追加

2. **パラメータマスターの拡張**
   - 各パラメータに型情報を追加
   - ブール型パラメータの識別

3. **UIコンポーネントの更新**
   - オペレータ選択の動的フィルタリング
   - 値入力欄の条件付き表示
   - 条件式プレビューの改善

4. **バリデーションロジックの更新**
   - ブール型オペレータの値チェックをスキップ

5. **テストケースの追加**
   - 各オペレータの動作確認
   - UI表示の確認