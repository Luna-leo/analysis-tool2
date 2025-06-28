import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { TimeseriesUtils } from '@/lib/server/sqlite/timeseriesUtils';
import { CSVDataPoint } from '@/types/csv-data';

export async function POST(request: NextRequest) {
  try {
    // フォームデータからファイルとメタデータを取得
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const plant = formData.get('plant') as string | null;
    const machineNo = formData.get('machineNo') as string | null;

    if (!file || !plant || !machineNo) {
      return NextResponse.json(
        { error: 'ファイル、プラント、機械番号は必須です' },
        { status: 400 }
      );
    }

    // CSVファイルのテキストを読み込み
    const text = await file.text();
    
    // CSVをパース
    const data = parseCSV(text);
    
    if (data.length === 0) {
      return NextResponse.json(
        { error: 'CSVファイルにデータがありません' },
        { status: 400 }
      );
    }

    console.log(`Uploading ${data.length} records for ${plant}/${machineNo}`);

    // SQLiteに保存
    const timeseriesUtils = new TimeseriesUtils();
    await timeseriesUtils.writeTimeseries({
      plant,
      machineNo,
      data
    });

    // メタデータを取得
    const metadata = await timeseriesUtils.getMetadata(plant, machineNo);

    return NextResponse.json({
      success: true,
      recordsUploaded: data.length,
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

function parseCSV(text: string): CSVDataPoint[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // ヘッダー行を解析
  const headers = lines[0].split(',').map(h => h.trim());
  
  // timestampカラムが必須
  const timestampIndex = headers.findIndex(h => h.toLowerCase() === 'timestamp');
  if (timestampIndex === -1) {
    throw new Error('CSVにtimestampカラムが必要です');
  }

  // データ行を解析
  const data: CSVDataPoint[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;

    const point: CSVDataPoint = {
      timestamp: values[timestampIndex]
    };

    // 他のカラムを数値として追加
    headers.forEach((header, index) => {
      if (index !== timestampIndex && values[index]) {
        const value = parseFloat(values[index]);
        if (!isNaN(value)) {
          point[header] = value;
        }
      }
    });

    data.push(point);
  }

  return data;
}