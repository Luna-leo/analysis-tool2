import { DuckDBConnection } from '../utils/duckdb/connection';
import { ParquetUtils } from '../utils/duckdb/parquetUtils';
import { DataConverter } from '../utils/duckdb/dataConverter';
import { SQLiteDatabase } from '../utils/sqlite/database';
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

async function testDuckDBParquet() {
  log('\n=== DuckDB + Parquet テスト ===', 'blue');
  
  try {
    // DuckDB接続を初期化
    const connection = DuckDBConnection.getInstance();
    await connection.initialize();
    log('✓ DuckDB接続初期化成功', 'green');
    log(`  データパス: ${connection.getDataPath()}`, 'yellow');

    // テストデータを作成
    const testData: CSVDataPoint[] = [
      { timestamp: '2024-01-01T00:00:00', temperature: 25.5, pressure: 1013.25 },
      { timestamp: '2024-01-01T01:00:00', temperature: 25.8, pressure: 1013.30 },
      { timestamp: '2024-01-01T02:00:00', temperature: 26.1, pressure: 1013.35 },
    ];

    // Parquetファイルに書き込み
    const parquetUtils = new ParquetUtils();
    const parquetPath = connection.getParquetPath('TestPlant', 'M001', '2024-01');
    log(`  Parquetパス: ${parquetPath}`, 'yellow');
    
    await parquetUtils.writeToParquet({
      plant: 'TestPlant',
      machineNo: 'M001',
      yearMonth: '2024-01',
      data: testData,
      append: false
    });
    log('✓ Parquetファイル書き込み成功', 'green');

    // Parquetファイルから読み込み
    const readData = await parquetUtils.readFromParquet({
      plant: 'TestPlant',
      machineNo: 'M001',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });
    log(`✓ Parquetファイル読み込み成功: ${readData.length}件のデータ`, 'green');
    console.log('  読み込みデータ例:', readData[0]);

    // メタデータ更新
    await parquetUtils.updateMetadata('TestPlant', 'M001', '2024-01');
    log('✓ メタデータ更新成功', 'green');

    await connection.close();
  } catch (error) {
    log(`✗ DuckDB/Parquetテスト失敗: ${error}`, 'red');
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

async function testDataConversion() {
  log('\n=== データ変換テスト ===', 'blue');
  
  try {
    const converter = new DataConverter();
    
    // 既存のIndexedDBデータがある場合は変換をテスト
    log('※ IndexedDBからの変換は、実際のデータがある場合に実行されます', 'yellow');
    
    // テスト用のPlantMachineData形式でParquet読み込みテスト
    const data = await converter.readParquetAsPlantMachineData(
      'TestPlant',
      'M001',
      '2024-01-01',
      '2024-01-31'
    );
    
    if (data) {
      log(`✓ Parquet→PlantMachineData変換成功: ${data.metadata.totalRecords}件`, 'green');
      log(`  パラメータ: ${data.metadata.parameters.join(', ')}`, 'green');
    }
  } catch (error) {
    log(`✗ データ変換テスト失敗: ${error}`, 'red');
  }
}

async function main() {
  log('サーバー連携基盤の動作確認を開始します...', 'yellow');
  
  await testDuckDBParquet();
  await testSQLiteUserManagement();
  await testDataConversion();
  
  log('\n動作確認完了！', 'green');
}

// テスト実行
main().catch(error => {
  log(`\nテスト実行エラー: ${error}`, 'red');
  process.exit(1);
});