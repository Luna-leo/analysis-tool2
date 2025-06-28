import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { TimeseriesUtils } from '@/lib/server/sqlite/timeseriesUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plant = searchParams.get('plant');
    const machineNo = searchParams.get('machineNo');

    const timeseriesUtils = new TimeseriesUtils();

    // 特定のプラント・機械のメタデータを取得
    if (plant && machineNo) {
      const metadata = await timeseriesUtils.getMetadata(plant, machineNo);
      
      if (!metadata) {
        return NextResponse.json(
          { error: 'データが見つかりません' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        metadata
      });
    }

    // 全体の統計情報を取得
    const statistics = await timeseriesUtils.getStatistics();
    
    // プラントと機械の一覧を作成
    const plants = new Set<string>();
    const machinesByPlant: Record<string, string[]> = {};
    
    statistics.forEach(stat => {
      plants.add(stat.plant);
      if (!machinesByPlant[stat.plant]) {
        machinesByPlant[stat.plant] = [];
      }
      machinesByPlant[stat.plant].push(stat.machine_no);
    });

    return NextResponse.json({
      plants: Array.from(plants),
      machinesByPlant,
      statistics,
      totalRecords: statistics.reduce((sum, stat) => sum + stat.record_count, 0)
    });

  } catch (error) {
    console.error('Metadata error:', error);
    return NextResponse.json(
      { 
        error: 'メタデータ取得エラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}