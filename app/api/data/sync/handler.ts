import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { TimeseriesUtils } from '@/lib/server/sqlite/timeseriesUtils';
import { CSVDataPoint } from '@/types/csv-data';

interface SyncRequest {
  plant: string;
  machineNo: string;
  data: CSVDataPoint[];
  clearExisting?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncRequest = await request.json();
    const { plant, machineNo, data, clearExisting = false } = body;

    if (!plant || !machineNo || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'プラント、機械番号、データ配列は必須です' },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'データが空です' },
        { status: 400 }
      );
    }

    console.log(`Syncing ${data.length} records for ${plant}/${machineNo}`);

    const timeseriesUtils = new TimeseriesUtils();
    
    // 既存データをクリアするオプション
    if (clearExisting) {
      const deletedCount = await timeseriesUtils.deleteTimeseries(plant, machineNo);
      console.log(`Deleted ${deletedCount} existing records`);
    }

    // データをバッチで保存
    const batchSize = 1000;
    let totalUploaded = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await timeseriesUtils.writeTimeseries({
        plant,
        machineNo,
        data: batch
      });
      totalUploaded += batch.length;
      
      // 進捗ログ
      if (data.length > batchSize) {
        console.log(`Progress: ${totalUploaded}/${data.length} records`);
      }
    }

    // メタデータを取得
    const metadata = await timeseriesUtils.getMetadata(plant, machineNo);

    return NextResponse.json({
      success: true,
      recordsSynced: totalUploaded,
      metadata
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { 
        error: '同期エラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}