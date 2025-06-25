# ChartEditModalのスクロール問題修正

## Meta Information
- **Created**: 2025-06-25
- **Updated**: 2025-06-25
- **Category**: Bug Fix
- **Related Commits**: [pending]
- **Affected Components**: 
  - components/charts/EditModal/TabContent.tsx
  - components/charts/EditModal/parameters/ParametersTab.tsx

## Overview
ChartEditModalにおいて、Y Parameterの設定数が多い場合にReference Line Sectionが画面外に押し出され、スクロールもできないためアクセスできない問題を修正しました。

## Details
### Background/Problem
ChartEditModalの左パネル（Parameters Tab）において、以下の問題が発生していました：
- Y Parameterを多数追加すると、コンテンツが縦に長くなる
- 左パネルにスクロールバーが表示されない
- Reference Line Sectionが画面下部に押し出されてアクセス不可能になる
- ユーザーがReference Lineの設定を行えない

### Implementation
スクロール可能な領域を実装し、すべてのセクションにアクセスできるようにしました：

1. **TabContent.tsx**
   - parametersタブのコンテナに`overflow-y-auto`クラスを追加
   - これにより、タブコンテンツ全体がスクロール可能に

2. **ParametersTab.tsx**
   - ルートコンテナから`h-full`クラスを削除
   - 代わりに`pb-4`を追加し、下部にパディングを確保
   - 高さの制限を柔軟にし、コンテンツに応じて自然に伸縮

### Technical Details
- Tailwind CSSのユーティリティクラスを使用
- `overflow-y-auto`: 縦方向のスクロールを必要に応じて表示
- `h-full`の削除: 親要素の高さに制限されず、コンテンツに応じて伸縮
- `pb-4`: 最下部のコンテンツが見切れないようにパディングを追加

## Usage
この修正により、以下の操作が可能になりました：
1. Y Parameterを多数追加してもすべての設定にアクセス可能
2. マウスホイールまたはスクロールバーでスクロール
3. Reference Line Sectionへの確実なアクセス

## Impact
- ChartEditModalの使いやすさが向上
- Y Parameterの数に関わらず、すべての機能が利用可能
- 他のタブ（Data Source、Appearance）には影響なし

## Testing
以下の方法で動作を確認できます：
1. ChartEditModalを開く
2. Parameters Tabを選択
3. Y Parameterを10個以上追加
4. スクロールしてReference Line Sectionにアクセスできることを確認

## Future Improvements
- スクロール位置の記憶機能の追加を検討
- セクション間のナビゲーション機能の追加を検討