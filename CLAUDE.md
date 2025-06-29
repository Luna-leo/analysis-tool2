# CLAUDE.md

## Commit Rules

### IMPORTANT: No Commits Without User Confirmation
**動作確認前にコミットしないでください** - ユーザーが動作確認を完了し、明示的にコミットを要求するまで、git commitコマンドを実行してはいけません。

This rule ensures:
- All changes are properly tested before committing
- User has verified functionality works as expected
- No premature commits that might introduce bugs

### Commit Process
1. Make all necessary code changes
2. Run type checks and verify no errors
3. **WAIT for user confirmation** - "動作確認完了" or explicit commit request
4. Only then proceed with git commit

## Windows Environment Setup

### DuckDB Native Module Issues
Windows環境で `Cannot find module ... duckdb.node` エラーが発生した場合：

1. **クリーンインストール**（推奨）
   ```powershell
   npm run rebuild:windows
   ```

2. **手動でのクリーンアップ**
   ```powershell
   npm run clean:windows
   npm run setup:windows
   ```

3. **詳細な手順**
   - docs/WINDOWS_SETUP.md を参照

### 重要な注意事項
- WSL2とWindows環境を切り替える場合は、必ずnode_modulesを再インストールすること
- Visual Studio Build Toolsが必要な場合がある
- Windows環境ではパス区切り文字の違いに注意