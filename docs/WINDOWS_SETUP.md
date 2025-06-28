# Windows環境でのセットアップガイド

## 概要
このドキュメントでは、Windows環境でサーバー連携機能を動作させるためのセットアップ手順を説明します。

## 前提条件
- Node.js 18以上がインストールされていること
- npm または yarn が使用可能であること
- Windows PowerShell または コマンドプロンプト

## エラー対処法

### DuckDBバインディングエラー
`Cannot find module ... node_modules\duckdb\lib\binding\duckdb.node` というエラーが発生した場合は、以下の手順で解決してください。

#### 原因
WSL2（Linux）環境でインストールしたnode_modulesをWindows環境で使用しようとしているため、ネイティブバインディングが不一致となっています。

#### 解決手順

1. **node_modulesの削除**
   ```powershell
   # PowerShellまたはコマンドプロンプトで実行
   cd C:\path\to\analysis-tool2
   rmdir /s /q node_modules
   del package-lock.json
   ```

2. **Windows環境での再インストール**
   ```powershell
   npm install
   ```

3. **ビルドエラーが発生する場合**
   
   Visual Studio Build Toolsのインストールが必要です：
   
   a. [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)をダウンロード
   
   b. インストーラーで以下を選択：
      - "Desktop development with C++" ワークロード
      - Windows 10 SDK
   
   c. インストール完了後、新しいPowerShellウィンドウで再度 `npm install`

4. **代替方法：プリビルドバイナリの使用**
   ```powershell
   # プリビルドバイナリを強制的に使用
   npm install duckdb@1.3.1 better-sqlite3@12.1.1 --force
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
   NEXT_PUBLIC_ENABLE_DUCKDB=true
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