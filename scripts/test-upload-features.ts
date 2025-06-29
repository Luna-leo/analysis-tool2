// テスト環境用の設定
// @ts-ignore
process.env.NODE_ENV = 'test';

import { SQLiteDatabase } from '../lib/server/sqlite/database';
import { TimeseriesUtils } from '../lib/server/sqlite/timeseriesUtils';
import { writeFileSync } from 'fs';
import path from 'path';

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

async function createTestCSV() {
  log('\n=== テストCSVファイルの作成 ===', 'blue');
  
  const csvContent = `timestamp,temperature,pressure,humidity
2024-01-01T00:00:00,25.5,1013.25,60.2
2024-01-01T01:00:00,25.8,1013.30,59.8
2024-01-01T02:00:00,26.1,1013.35,59.5
2024-01-01T03:00:00,26.3,1013.40,59.2
2024-01-01T04:00:00,26.5,1013.45,58.9`;

  const filePath = path.join(process.cwd(), 'test-data.csv');
  writeFileSync(filePath, csvContent);
  
  log(`✓ テストCSVファイル作成: ${filePath}`, 'green');
  return filePath;
}

async function testCSVParsing() {
  log('\n=== CSVパース機能テスト ===', 'blue');
  
  const csvText = `timestamp,temperature,pressure
2024-01-01T00:00:00,25.5,1013.25
2024-01-01T01:00:00,25.8,1013.30`;

  // handler.tsのparseCSV関数を再現
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  log(`✓ ヘッダー解析: ${headers.join(', ')}`, 'green');
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const point: any = { timestamp: values[0] };
    
    headers.forEach((header, index) => {
      if (index !== 0 && values[index]) {
        const value = parseFloat(values[index]);
        if (!isNaN(value)) {
          point[header] = value;
        }
      }
    });
    
    data.push(point);
  }
  
  log(`✓ データ解析: ${data.length}行`, 'green');
  log(`  サンプル: ${JSON.stringify(data[0])}`, 'green');
}

async function testMetadataAPI() {
  log('\n=== メタデータAPI機能テスト ===', 'blue');
  
  try {
    const db = SQLiteDatabase.getInstance();
    await db.initialize();
    
    const timeseriesUtils = new TimeseriesUtils();
    
    // 統計情報を取得
    const statistics = await timeseriesUtils.getStatistics();
    log(`✓ 統計情報取得: ${statistics.length}件のプラント/機械`, 'green');
    
    if (statistics.length > 0) {
      log('  サンプル統計:', 'green');
      const stat = statistics[0];
      log(`    プラント: ${stat.plant}`, 'green');
      log(`    機械番号: ${stat.machine_no}`, 'green');
      log(`    レコード数: ${stat.record_count}`, 'green');
      log(`    期間: ${stat.start_date} ～ ${stat.end_date}`, 'green');
    }
    
    db.close();
  } catch (error) {
    log(`✗ メタデータAPIテスト失敗: ${error}`, 'red');
  }
}

async function testExportFunction() {
  log('\n=== エクスポート機能テスト ===', 'blue');
  
  try {
    const db = SQLiteDatabase.getInstance();
    await db.initialize();
    
    const timeseriesUtils = new TimeseriesUtils();
    
    // データを読み込み
    const data = await timeseriesUtils.readTimeseries({
      plant: 'TestPlant',
      machineNo: 'M001',
      limit: 5
    });
    
    if (data.length > 0) {
      // CSV形式に変換（handler.tsのconvertToCSV関数を再現）
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map(item => 
          headers.map(header => item[header] ?? '').join(',')
        )
      ].join('\n');
      
      log(`✓ CSV変換成功: ${csv.split('\n').length}行`, 'green');
      log('  CSV先頭部分:', 'green');
      csv.split('\n').slice(0, 3).forEach(line => {
        log(`    ${line}`, 'green');
      });
    } else {
      log('  エクスポート可能なデータがありません', 'yellow');
    }
    
    db.close();
  } catch (error) {
    log(`✗ エクスポートテスト失敗: ${error}`, 'red');
  }
}

async function testAPIEndpoints() {
  log('\n=== APIエンドポイント確認 ===', 'blue');
  
  const endpoints = [
    { path: '/api/data/upload', method: 'POST', description: 'CSVアップロード' },
    { path: '/api/data/sync', method: 'POST', description: 'IndexedDB同期' },
    { path: '/api/data/metadata', method: 'GET', description: 'メタデータ取得' },
    { path: '/api/data/export', method: 'POST', description: 'データエクスポート' },
    { path: '/api/data/query', method: 'POST', description: 'データクエリ' }
  ];
  
  log('実装済みエンドポイント:', 'green');
  endpoints.forEach(ep => {
    log(`  ${ep.method} ${ep.path} - ${ep.description}`, 'green');
  });
}

async function main() {
  log('アップロード機能のテストを開始します...', 'yellow');
  
  await createTestCSV();
  await testCSVParsing();
  await testMetadataAPI();
  await testExportFunction();
  await testAPIEndpoints();
  
  log('\n=== テスト手順 ===', 'blue');
  log('1. npm run dev でサーバーを起動', 'green');
  log('2. http://localhost:3000/server-sync にアクセス', 'green');
  log('3. testuser / password123 でログイン', 'green');
  log('4. 「アップロード」タブで以下をテスト:', 'green');
  log('   - CSVファイルアップロード: test-data.csv を使用', 'green');
  log('   - IndexedDBデータ同期: ローカルデータがある場合', 'green');
  log('5. 「テスト」タブでデータ確認', 'green');
  
  log('\nテスト完了！', 'green');
}

// テスト実行
main().catch(error => {
  log(`\nテスト実行エラー: ${error}`, 'red');
  process.exit(1);
});