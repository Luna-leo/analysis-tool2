import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { TimeseriesUtils } from '@/lib/server/sqlite/timeseriesUtils';
import { CSVDataPoint } from '@/types/csv-data';

export async function POST(request: NextRequest) {
  try {
    // JSONデータを取得
    const body = await request.json();
    const { plant, machineNo, sourceType, data, parameters, units } = body;

    if (!plant || !machineNo || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'プラント、機械番号、データは必須です' },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'データが空です' },
        { status: 400 }
      );
    }

    console.log(`Uploading ${data.length} records from IndexedDB for ${plant}/${machineNo}`);
    console.log(`Source type: ${sourceType}, Parameters: ${parameters?.length || 0}`);

    // SQLiteに保存
    const timeseriesUtils = new TimeseriesUtils();
    
    // データの整合性チェック
    const validData = data.filter((point: CSVDataPoint) => {
      return point.timestamp && typeof point.timestamp === 'string';
    });

    if (validData.length === 0) {
      return NextResponse.json(
        { error: 'すべてのデータにタイムスタンプが必要です' },
        { status: 400 }
      );
    }

    // データを保存
    await timeseriesUtils.writeTimeseries({
      plant,
      machineNo,
      data: validData
    });

    // メタデータを取得
    const metadata = await timeseriesUtils.getMetadata(plant, machineNo);

    return NextResponse.json({
      success: true,
      recordsUploaded: validData.length,
      metadata
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'アップロードエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}