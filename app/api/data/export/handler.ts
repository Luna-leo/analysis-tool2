import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { TimeseriesUtils } from '@/lib/server/sqlite/timeseriesUtils';

interface ExportRequest {
  plant: string;
  machineNo: string;
  startDate?: string;
  endDate?: string;
  parameters?: string[];
  format?: 'csv' | 'json';
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { plant, machineNo, startDate, endDate, parameters, format = 'csv' } = body;

    if (!plant || !machineNo) {
      return NextResponse.json(
        { error: 'プラントと機械番号は必須です' },
        { status: 400 }
      );
    }

    console.log(`Exporting data for ${plant}/${machineNo} in ${format} format`);

    // データを読み込み
    const timeseriesUtils = new TimeseriesUtils();
    const data = await timeseriesUtils.readTimeseries({
      plant,
      machineNo,
      startDate,
      endDate,
      parameters
    });

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'エクスポートするデータがありません' },
        { status: 404 }
      );
    }

    // フォーマットに応じてレスポンスを作成
    if (format === 'json') {
      return NextResponse.json({
        plant,
        machineNo,
        dateRange: {
          start: startDate || data[0].timestamp,
          end: endDate || data[data.length - 1].timestamp
        },
        recordCount: data.length,
        data
      });
    }

    // CSV形式でエクスポート
    const csv = convertToCSV(data, parameters);
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${plant}_${machineNo}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { 
        error: 'エクスポートエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any[], parameters?: string[]): string {
  if (data.length === 0) return '';

  // ヘッダーを作成
  const firstItem = data[0];
  let headers = Object.keys(firstItem);
  
  // パラメータが指定されている場合はフィルタリング
  if (parameters && parameters.length > 0) {
    headers = ['timestamp', ...parameters.filter(p => p !== 'timestamp')];
  }

  const csv = [
    // ヘッダー行
    headers.join(','),
    // データ行
    ...data.map(item => 
      headers.map(header => {
        const value = item[header];
        // 値に改行やカンマが含まれる場合はダブルクォートで囲む
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  // BOM付きUTF-8として返す（Excelで開いた時の文字化け対策）
  return '\ufeff' + csv;
}