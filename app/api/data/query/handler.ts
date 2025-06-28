import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { DuckDBConnection } from '@/lib/server/duckdb/connection';
import { ParquetUtils } from '@/lib/server/duckdb/parquetUtils';

export async function handler(request: NextRequest) {
  try {
    const { plant, machineNo, startDate, endDate, parameters, limit } = await request.json();

    if (!plant || !machineNo) {
      return NextResponse.json(
        { error: 'プラントと機械番号が必要です' },
        { status: 400 }
      );
    }

    // DuckDB接続を初期化
    const connection = DuckDBConnection.getInstance();
    await connection.initialize();

    // Parquetからデータを読み込み
    const parquetUtils = new ParquetUtils();
    const data = await parquetUtils.readFromParquet({
      plant,
      machineNo,
      startDate,
      endDate,
      parameters,
      limit
    });

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
    console.error('Data query error:', error);
    return NextResponse.json(
      { error: 'データクエリエラーが発生しました' },
      { status: 500 }
    );
  }
}