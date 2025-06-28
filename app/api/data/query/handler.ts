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

    console.log('Query parameters:', { plant, machineNo, startDate, endDate });

    // DuckDB接続を初期化
    const connection = DuckDBConnection.getInstance();
    console.log('Data path:', connection.getDataPath());
    
    await connection.initialize();
    console.log('DuckDB initialized');

    // Parquetパスの確認
    const parquetPath = connection.getParquetPath(plant, machineNo, '2024-01');
    console.log('Parquet path:', parquetPath);

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