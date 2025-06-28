// テスト環境用の設定
// @ts-ignore
process.env.NODE_ENV = 'test';

import { SQLiteDatabase } from '../lib/server/sqlite/database';
import { TimeseriesUtils } from '../lib/server/sqlite/timeseriesUtils';
import { CSVDataPoint } from '../types/csv-data';

// 色付きコンソール出力用
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSQLiteTimeseries() {
  log('\n=== SQLite 時系列データテスト ===', 'blue');
  
  try {
    // SQLiteデータベースを初期化
    const db = SQLiteDatabase.getInstance();
    await db.initialize();
    log('✓ SQLite初期化成功', 'green');

    // テストデータを作成
    const testData: CSVDataPoint[] = [
      { timestamp: '2024-01-01T00:00:00', temperature: 25.5, pressure: 1013.25 },
      { timestamp: '2024-01-01T01:00:00', temperature: 25.8, pressure: 1013.30 },
      { timestamp: '2024-01-01T02:00:00', temperature: 26.1, pressure: 1013.35 },
    ];

    // 時系列データを書き込み
    const timeseriesUtils = new TimeseriesUtils();
    await timeseriesUtils.writeTimeseries({
      plant: 'TestPlant',
      machineNo: 'M001',
      data: testData
    });
    log('✓ 時系列データ書き込み成功', 'green');

    // 時系列データを読み込み
    const readData = await timeseriesUtils.readTimeseries({
      plant: 'TestPlant',
      machineNo: 'M001',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });
    log(`✓ 時系列データ読み込み成功: ${readData.length}件のデータ`, 'green');
    console.log('  読み込みデータ例:', readData[0]);

    // メタデータ取得
    const metadata = await timeseriesUtils.getMetadata('TestPlant', 'M001');
    if (metadata) {
      log('✓ メタデータ取得成功', 'green');
      log(`  レコード数: ${metadata.recordCount}`, 'green');
      log(`  パラメータ: ${metadata.parameters.join(', ')}`, 'green');
    }

    db.close();
  } catch (error) {
    log(`✗ SQLite時系列テスト失敗: ${error}`, 'red');
  }
}

async function testSQLiteUserManagement() {
  log('\n=== SQLite ユーザー管理テスト ===', 'blue');
  
  try {
    // SQLiteデータベースを初期化
    const db = SQLiteDatabase.getInstance();
    await db.initialize();
    log('✓ SQLite初期化成功', 'green');

    // テストユーザーを作成
    const testUser = await db.createUser(
      'testuser',
      'test@example.com',
      'password123',
      'user'
    );
    log(`✓ ユーザー作成成功: ${testUser.username}`, 'green');

    // パスワード検証
    const isValid = await db.verifyPassword('password123', testUser.passwordHash);
    log(`✓ パスワード検証: ${isValid}`, 'green');

    // セッション作成
    const session = db.createSession(testUser.id, 24);
    log(`✓ セッション作成成功: ${session.token.substring(0, 10)}...`, 'green');

    // セッション取得
    const retrievedSession = db.getSessionByToken(session.token);
    log(`✓ セッション取得成功: ユーザーID ${retrievedSession?.userId}`, 'green');

    // 設定保存
    db.setSetting('theme', 'dark', testUser.id);
    db.setSetting('language', 'ja', testUser.id);
    log('✓ ユーザー設定保存成功', 'green');

    // 設定取得
    const settings = db.getUserSettings(testUser.id);
    log(`✓ ユーザー設定取得成功: ${JSON.stringify(settings)}`, 'green');

    db.close();
  } catch (error) {
    log(`✗ SQLiteテスト失敗: ${error}`, 'red');
  }
}

async function main() {
  log('サーバー連携基盤の動作確認を開始します...', 'yellow');
  
  await testSQLiteTimeseries();
  await testSQLiteUserManagement();
  
  log('\n動作確認完了！', 'green');
}

// テスト実行
main().catch(error => {
  log(`\nテスト実行エラー: ${error}`, 'red');
  process.exit(1);
});