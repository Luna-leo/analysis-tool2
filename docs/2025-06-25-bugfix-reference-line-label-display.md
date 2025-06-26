# Reference Lineのラベル表示改善

## Meta Information
- **Created**: 2025-06-25
- **Updated**: 2025-06-25
- **Category**: Bug Fix
- **Related Commits**: 113e22a, (次のコミット)
- **Affected Components**: 
  - `/components/charts/ChartPreview/ReferenceLines/index.tsx`
  - `/components/charts/ChartPreview/ReferenceLines/VerticalReferenceLine.tsx`
  - `/components/charts/ChartPreview/ReferenceLines/HorizontalReferenceLine.tsx`

## Overview
Reference LineのPan/Zoom時の表示問題を修正し、ラベルの表示を改善しました。

## Details

### Background/Problem
1. **クリッピング問題**: Reference LineがPan/Zoom時にプロットエリアを超えて表示される
2. **ラベル表示問題**: clip-pathを適用した結果、ラベルもプロットエリア内に制限されてしまう

### Implementation

#### Phase 1: クリッピング問題の修正
- Reference Lineレイヤーにclip-pathを適用
- プロットエリアのサイズに合わせたclip領域を定義
- 不要なdisplay制御を削除

#### Phase 2: ラベル表示の改善
- LineとLabelを別々のレイヤーで管理する構造に変更
- 新しいレイヤー構造：
  ```
  reference-lines-layer
  ├── reference-lines-clip-group (clip-path適用)
  │   └── 各reference-line-group (Line本体)
  └── reference-labels-group (clip-pathなし)
      └── 各line-label-group (Label)
  ```

### Technical Details

#### レイヤー管理
- `reference-lines-clip-group`: Line本体とインタラクティブエリア用（clip-path適用）
- `reference-labels-group`: Label用（clip-pathなし）

#### 表示/非表示ロジック
- Lineの表示位置をチェックし、完全にプロットエリア外の場合はラベルも非表示
- Vertical Line: `xPos < -5 || xPos > width + 5`の場合は非表示
- Horizontal Line: `yPos < -5 || yPos > height + 5`の場合は非表示
- 5ピクセルの余裕を設けることで、境界付近での動作を安定化

#### 実装の変更点
1. `drawReferenceLines`関数に`labelsGroup`パラメータを追加
2. `VerticalReferenceLine`と`HorizontalReferenceLine`に`labelGroup`プロパティを追加
3. ラベルのDOM操作を新しいグループ構造に対応
4. ラベルドラッグ時のLine位置取得ロジックを更新

## Usage
Reference Lineの使用方法に変更はありません。従来通り：
- Reference Lineを追加
- Pan/Zoomで表示位置を調整
- ラベルをドラッグして位置を調整

## Impact
- Reference LineがPan/Zoom時に適切にクリップされる
- ラベルはプロットエリア外でも表示可能
- Lineが完全に見えない場合はラベルも非表示になる
- パフォーマンスへの影響は最小限

## Testing
以下の項目を確認：
1. Reference Lineを追加し、Pan/Zoomを実行
2. Lineがプロットエリアの境界で適切にクリップされること
3. ラベルがプロットエリア外でも表示されること
4. Lineが完全にプロットエリア外に移動した場合、ラベルも非表示になること
5. ラベルのドラッグが正常に動作すること

## Future Improvements
- ラベルの表示/非表示をアニメーション化
- ラベルがプロットエリアから離れすぎた場合の位置制限
- 複数のReference Lineが重なった場合のラベル位置の自動調整