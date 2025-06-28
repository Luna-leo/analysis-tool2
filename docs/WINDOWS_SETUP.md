# Windows環境でのセットアップガイド

## 概要
このドキュメントでは、Windows環境でサーバー連携機能を動作させるためのセットアップ手順を説明します。

## 前提条件
- Node.js 18以上（64ビット版）がインストールされていること
- npm または yarn が使用可能であること
- Windows PowerShell または コマンドプロンプト
- Microsoft Visual C++ Redistributable（推奨）

## エラー対処法

### Next.js SWCバイナリエラー
`Attempted to load @next/swc-win32-x64-msvc, but an error occurred: ... next-swc.win32-x64-msvc.node is not a valid Win32 application` というエラーが発生した場合は、以下の手順で解決してください。

#### 原因
Next.jsはRustベースのコンパイラSWCを使用しており、Windows環境では Microsoft Visual C++ Redistributable が必要です。

#### 解決手順

1. **Microsoft Visual C++ Redistributableのインストール（最も一般的な解決策）**
   
   以下のリンクからダウンロードしてインストール：
   https://aka.ms/vs/17/release/vc_redist.x64.exe

2. **クリーンインストール**
   ```powershell
   # PowerShellまたはコマンドプロンプトで実行
   cd C:\path\to\analysis-tool2
   rmdir /s /q node_modules
   del package-lock.json
   npm cache clean --force
   npm install
   ```

3. **SWCパッケージの再インストール**
   ```powershell
   npm i @next/swc-win32-x64-msvc
   npm run build
   npx next clear
   npm run dev
   ```

4. **Node.jsアーキテクチャの確認**
   ```powershell
   node -p "process.arch"
   ```
   x64が表示されることを確認。ia32の場合は64ビット版のNode.jsを再インストール。

5. **どうしても解決しない場合の代替方法**
   
   `next.config.mjs`でSWCを無効化してBabelを使用：
   ```javascript
   const nextConfig = {
     swcMinify: false,
     // 他の設定...
   }
   ```

### SQLite/Better-SQLite3エラー
ネイティブモジュールのビルドエラーが発生する場合：

1. **Visual Studio Build Toolsのインストール**
   
   a. [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)をダウンロード
   
   b. インストーラーで以下を選択：
      - "Desktop development with C++" ワークロード
      - Windows 10 SDK
   
   c. インストール完了後、新しいPowerShellウィンドウで再度 `npm install`

2. **プリビルドバイナリの使用**
   ```powershell
   npm install better-sqlite3@12.1.1 --force
   ```

## セットアップ手順

1. **プロジェクトのクローン**
   ```powershell
   git clone <repository-url>
   cd analysis-tool2
   ```

2. **依存関係のインストール**
   ```powershell
   npm install
   ```

3. **環境変数の設定**
   `.env.local` ファイルを作成：
   ```
   DATA_PATH=./data
   SQLITE_PATH=./data/users/app.db
   NODE_ENV=development
   ```

4. **テストデータの作成**
   ```powershell
   npm run test:server
   ```

5. **開発サーバーの起動**
   ```powershell
   npm run dev
   ```

## トラブルシューティング

### ポート競合
デフォルトでは3000番ポートを使用します。使用中の場合は：
```powershell
$env:PORT=3001; npm run dev
```

### 長いパス名エラー
Windows 10では長いパス名のサポートを有効にする必要があります：
1. グループポリシーエディタで「Win32の長いパスを有効にする」を設定
2. または管理者権限でPowerShellで：
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

### Windows Defenderの除外設定
node_modulesフォルダをWindows Defenderのスキャン対象から除外することで、パフォーマンスが向上します：
1. Windows セキュリティを開く
2. ウイルスと脅威の防止 > 設定の管理
3. 除外の追加または削除
4. node_modulesフォルダを追加

## 動作確認

1. ブラウザで http://localhost:3000 にアクセス
2. サイドバーのCloudアイコンをクリック
3. 「サーバー連携」をクリック
4. testuser / password123 でログイン
5. 「テスト」タブで「テストデータをクエリ」をクリック

正常に動作すれば、3件のテストデータが表示されます。

## 注意事項

- WSL2とWindows環境を行き来する場合は、それぞれの環境でnode_modulesを再インストールする必要があります
- 本番環境へのデプロイ時は、Windows Server上で `npm ci --production` を実行してください
- ファイルパスはすべて相対パスまたは環境変数で設定することを推奨します
- Microsoft Visual C++ Redistributableは事前にインストールしておくことを強く推奨します
- Node.jsは必ず64ビット版を使用してください（32ビット版ではSWCエラーが発生します）