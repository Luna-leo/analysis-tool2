import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { TimeseriesUtils } from '@/lib/server/sqlite/timeseriesUtils';

export async function handler(request: NextRequest) {
  try {
    const { plant, machineNo, startDate, endDate, parameters, limit } = await request.json();

    if (!plant || !machineNo) {
      return NextResponse.json(
        { error: 'プラントと機械番号が必要です' },
        { status: 400 }
      );
    }

    console.log('Query parameters:', { plant, machineNo, startDate, endDate });

    // SQLiteで時系列データを読み込み
    const timeseriesUtils = new TimeseriesUtils();
    const data = await timeseriesUtils.readTimeseries({
      plant,
      machineNo,
      startDate,
      endDate,
      parameters,
      limit
    });

    console.log('Data loaded successfully, count:', data.length);

    return NextResponse.json({
      data,
      count: data.length,
      metadata: {
        plant,
        machineNo,
        dateRange: {
          start: startDate || 'all',
          end: endDate || 'all'
        }
      }
    });
  } catch (error) {
    console.error('Data query error - Full details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'データクエリエラーが発生しました',
        details: error instanceof Error ? error.message : String(error),
        // 開発環境でのみ詳細情報を返す
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined
        })
      },
      { status: 500 }
    );
  }
}