import { ParquetUtils } from './parquetUtils';
import { PlantMachineData } from '@/types/plant-machine-data';
import { CSVData, CSVDataPoint } from '@/types/csv-data';
import { getPlantMachineData, getAllPlantMachineMetadata } from '@/utils/plantMachineDataUtils';
import { getAllCSVMetadataFromDB, getCSVDataFromDB } from '@/utils/indexedDBUtils';

export class DataConverter {
  private parquetUtils: ParquetUtils;

  constructor() {
    this.parquetUtils = new ParquetUtils();
  }

  // PlantMachineDataをParquetに変換
  async convertPlantMachineDataToParquet(plantMachineId: string): Promise<void> {
    console.log(`Converting PlantMachineData ${plantMachineId} to Parquet...`);
    
    const data = await getPlantMachineData(plantMachineId);
    if (!data) {
      console.warn(`No data found for ${plantMachineId}`);
      return;
    }

    // データを年月でグループ化
    const dataByYearMonth = this.groupDataByYearMonth(data.data);

    // 各年月ごとにParquetファイルを作成
    for (const [yearMonth, monthData] of Object.entries(dataByYearMonth)) {
      await this.parquetUtils.writeToParquet({
        plant: data.plant,
        machineNo: data.machineNo,
        yearMonth,
        data: monthData,
        append: false
      });

      // メタデータを更新
      await this.parquetUtils.updateMetadata(data.plant, data.machineNo, yearMonth);
    }

    console.log(`Successfully converted ${plantMachineId} to Parquet`);
  }

  // 期間ベースのCSVDataをParquetに変換
  async convertPeriodCSVDataToParquet(periodId: string): Promise<void> {
    console.log(`Converting period CSV data ${periodId} to Parquet...`);
    
    const csvData = await getCSVDataFromDB(periodId);
    if (!csvData) {
      console.warn(`No CSV data found for period ${periodId}`);
      return;
    }

    // 期間IDから工場と機械番号を抽出（期間IDの形式: "PlantA_M001_2024-01-01_2024-01-31"など）
    const parts = periodId.split('_');
    if (parts.length < 4) {
      console.error(`Invalid period ID format: ${periodId}`);
      return;
    }

    const plant = parts[0];
    const machineNo = parts[1];

    // データを年月でグループ化
    const dataByYearMonth = this.groupDataByYearMonth(csvData.data);

    // 各年月ごとにParquetファイルを作成
    for (const [yearMonth, monthData] of Object.entries(dataByYearMonth)) {
      await this.parquetUtils.writeToParquet({
        plant,
        machineNo,
        yearMonth,
        data: monthData,
        append: true // 期間データは追加モード
      });

      // メタデータを更新
      await this.parquetUtils.updateMetadata(plant, machineNo, yearMonth);
    }

    console.log(`Successfully converted period ${periodId} to Parquet`);
  }

  // すべてのPlantMachineDataをParquetに変換
  async convertAllPlantMachineData(): Promise<void> {
    console.log('Starting conversion of all PlantMachineData to Parquet...');
    
    const allMetadata = await getAllPlantMachineMetadata();
    
    for (const metadata of allMetadata) {
      try {
        await this.convertPlantMachineDataToParquet(metadata.id);
      } catch (error) {
        console.error(`Error converting ${metadata.id}:`, error);
      }
    }

    console.log('Completed conversion of all PlantMachineData');
  }

  // すべての期間ベースCSVDataをParquetに変換
  async convertAllPeriodCSVData(): Promise<void> {
    console.log('Starting conversion of all period CSV data to Parquet...');
    
    const allMetadata = await getAllCSVMetadataFromDB();
    
    for (const metadata of allMetadata) {
      try {
        await this.convertPeriodCSVDataToParquet(metadata.periodId);
      } catch (error) {
        console.error(`Error converting period ${metadata.periodId}:`, error);
      }
    }

    console.log('Completed conversion of all period CSV data');
  }

  // データを年月でグループ化
  private groupDataByYearMonth(data: CSVDataPoint[]): Record<string, CSVDataPoint[]> {
    const grouped: Record<string, CSVDataPoint[]> = {};

    for (const point of data) {
      const timestamp = point.timestamp;
      const yearMonth = timestamp.substring(0, 7); // YYYY-MM形式

      if (!grouped[yearMonth]) {
        grouped[yearMonth] = [];
      }
      grouped[yearMonth].push(point);
    }

    return grouped;
  }

  // Parquetからデータを読み込んでPlantMachineData形式に変換
  async readParquetAsPlantMachineData(
    plant: string,
    machineNo: string,
    startDate?: string,
    endDate?: string
  ): Promise<PlantMachineData | null> {
    const data = await this.parquetUtils.readFromParquet({
      plant,
      machineNo,
      startDate,
      endDate
    });

    if (data.length === 0) {
      return null;
    }

    // パラメータを抽出
    const parameters = new Set<string>();
    for (const point of data) {
      Object.keys(point).forEach(key => {
        if (key !== 'timestamp') {
          parameters.add(key);
        }
      });
    }

    return {
      id: `${plant}_${machineNo}`,
      plant,
      machineNo,
      data,
      importHistory: [], // 履歴は別途管理
      metadata: {
        totalRecords: data.length,
        parameters: Array.from(parameters),
        dateRange: {
          min: data[0].timestamp,
          max: data[data.length - 1].timestamp
        },
        units: {}, // 単位情報は別途管理
        lastUpdated: new Date().toISOString()
      }
    };
  }
}