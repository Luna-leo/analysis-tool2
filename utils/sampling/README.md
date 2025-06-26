# Data Sampling Module

統一されたデータサンプリングモジュールで、大規模データセットの視覚化を最適化します。

## 概要

このモジュールは、以下のサンプリングアルゴリズムを提供します：

- **LTTB (Largest Triangle Three Buckets)**: 時系列データの視覚的特徴を保持
- **Nth-Point Sampling**: 高速で均等な分布を実現
- **Douglas-Peucker**: ラインの形状を保持しながら簡略化
- **Adaptive Sampling**: データ特性に基づいて最適な手法を自動選択

## 使用方法

### 基本的な使用法

```typescript
import { sampleData } from '@/utils/sampling'

const result = sampleData(data, {
  method: 'auto',          // 'auto' | 'lttb' | 'nth-point' | 'douglas-peucker' | 'none'
  targetPoints: 1000,      // 目標データポイント数
  chartType: 'line',       // オプション: チャートタイプのヒント
  isTimeSeries: true       // オプション: 時系列データかどうか
})

console.log(result.sampledCount) // サンプリング後のデータポイント数
```

### 複数シリーズの一括サンプリング

```typescript
import { sampleMultipleSeries } from '@/utils/sampling'

const seriesData = new Map([
  ['series1', data1],
  ['series2', data2]
])

const results = sampleMultipleSeries(seriesData, {
  method: 'auto',
  targetPoints: 2000  // 全シリーズの合計目標ポイント数
})
```

### プログレッシブサンプリング（リアルタイムデータ用）

```typescript
import { ProgressiveSampler } from '@/utils/sampling'

const sampler = new ProgressiveSampler({
  method: 'lttb',
  targetPoints: 500
}, 10000) // ウィンドウサイズ

// 新しいデータポイントを追加
sampler.addPoints(newDataPoints)

// 現在のサンプリング済みデータを取得
const sampled = sampler.getSampled()
```

## アルゴリズムの選択基準

### Auto モード

`method: 'auto'` を指定すると、以下の基準で自動的に最適なアルゴリズムを選択します：

1. **時系列データ + 高分散**: LTTB
2. **散布図**: Stratified Nth-Point
3. **ライン/エリアチャート**: Douglas-Peucker または LTTB
4. **大規模データ（閾値超過）**: 多段階サンプリング

### 各アルゴリズムの特徴

| アルゴリズム | 長所 | 短所 | 最適な用途 |
|------------|------|------|-----------|
| LTTB | 視覚的特徴を保持 | 処理時間がやや長い | 時系列データ、波形データ |
| Nth-Point | 高速、メモリ効率的 | 重要な特徴を見逃す可能性 | 大規模データの初期処理 |
| Douglas-Peucker | ライン形状を正確に保持 | メモリ使用量が多い | 地理データ、精密な線グラフ |

## パフォーマンス設定との連携

`PerformanceSettings` でサンプリングの挙動を制御できます：

```typescript
{
  dataProcessing: {
    enableSampling: true,        // サンプリングの有効/無効
    defaultSamplingPoints: 500,  // デフォルトの目標ポイント数
    samplingMethod: 'auto'       // デフォルトのサンプリング手法
  }
}
```

## パフォーマンス特性

- 10,000ポイント → 500ポイント: ~20ms
- 100,000ポイント → 1,000ポイント: ~100ms（多段階サンプリング使用）
- メモリ効率: O(n) メモリ使用量

## 移行ガイド

既存の `dataSampling.ts` を使用している場合：

```typescript
// 旧
import { adaptiveSample } from '@/utils/dataSampling'
const sampled = adaptiveSample(data, 1000)

// 新
import { sampleData } from '@/utils/sampling'
const result = sampleData(data, { method: 'auto', targetPoints: 1000 })
const sampled = result.data
```