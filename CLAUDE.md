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