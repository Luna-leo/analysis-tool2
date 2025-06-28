import { CSVDataPoint } from '@/stores/useCSVDataStore'

/**
 * Plant/Machine単位で統合されたデータ構造
 * 同一のPlant/Machineのすべてのデータを時系列順に保持
 */
export interface PlantMachineData {
  /**
   * 主キー: Plant_Machine の組み合わせ
   * 例: "PlantA_M001"
   */
  id: string
  
  /**
   * プラント名
   */
  plant: string
  
  /**
   * 機械番号
   */
  machineNo: string
  
  /**
   * 統合されたデータ（時系列順、重複排除済み）
   */
  data: CSVDataPoint[]
  
  /**
   * インポート履歴（監査証跡）
   */
  importHistory: ImportHistoryRecord[]
  
  /**
   * メタデータ
   */
  metadata: PlantMachineMetadata
}

/**
 * インポート履歴レコード
 */
export interface ImportHistoryRecord {
  /**
   * 元のperiodId（後方互換性のため）
   */
  periodId: string
  
  /**
   * インポート日時
   */
  importedAt: string
  
  /**
   * データの開始日時
   */
  startDate: string
  
  /**
   * データの終了日時
   */
  endDate: string
  
  /**
   * データソースタイプ（CASS, ACS等）
   */
  dataSourceType: string
  
  /**
   * インポートしたファイル数
   */
  fileCount: number
  
  /**
   * インポートしたレコード数
   */
  recordCount: number
  
  /**
   * イベント情報（EventMaster連携用）
   */
  eventInfo?: {
    label: string
    labelDescription: string
    event: string
    eventDetail: string
  }
}

/**
 * Plant/Machineデータのメタデータ
 */
export interface PlantMachineMetadata {
  /**
   * 総レコード数
   */
  totalRecords: number
  
  /**
   * データの日付範囲
   */
  dateRange: {
    min: string
    max: string
  }
  
  /**
   * 利用可能なパラメータ名
   */
  parameters: string[]
  
  /**
   * パラメータの単位
   */
  units: Record<string, string>
  
  /**
   * 最終更新日時
   */
  lastUpdated: string
}