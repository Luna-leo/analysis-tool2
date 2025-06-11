# Test: Switch ON/OFF Conditions

## 実装完了内容

### 1. 新しいオペレータタイプ
- `isOn`: パラメータがONの状態
- `isOff`: パラメータがOFFの状態
- `switchedOn`: OFF→ONに変化した瞬間
- `switchedOff`: ON→OFFに変化した瞬間

### 2. UI改善
- すべてのオペレータが選択可能
- `is ON`, `is OFF`, `switched ON`, `switched OFF`を選択時は値入力欄が自動的に非表示
- その他のオペレータ選択時は値入力欄が表示される

## テスト例

### 例1: ポンプ稼働状態の監視
```
条件: pump_switch is ON AND valve_01_status is ON
説明: ポンプが稼働中で、バルブが開いている状態を検出
```

### 例2: 機器の起動検出
```
条件: motor_01 switched ON OR valve_02_status switched ON
説明: モーターまたはバルブが起動した瞬間を検出
```

### 例3: 複合条件
```
条件: temperature > 75 AND pump_switch switched OFF
説明: 温度が75度を超えた時にポンプが停止した場合を検出
```

## 使用方法

1. **パラメータ入力**
   - 任意のパラメータ名を入力（例：`pump_switch`, `temperature`）

2. **オペレータ選択**
   - すべてのオペレータから選択可能
   - スイッチ系：`is ON`, `is OFF`, `switched ON`, `switched OFF`
   - 数値系：`>`, `>=`, `<`, `<=`, `=`, `!=`, `crosses above`, `crosses below`

3. **値入力**
   - スイッチ系オペレータ選択時：値入力欄は自動的に非表示
   - 数値系オペレータ選択時：値入力欄が表示される

## 技術詳細

### 実装詳細
- `OperatorType`に4つの新しいオペレータを追加
- `isBooleanOperator`関数でスイッチ系オペレータを判定
- オペレータ選択に基づいて値入力欄の表示/非表示を動的に制御

### バリデーション
- スイッチ系オペレータの場合、値チェックをスキップ
- パラメータ名とオペレータのみでバリデーション可能

### 表示ロジック
- 条件式の表示で値を省略（例：`pump_switch is ON`）
- カラーコーディングも対応済み