
import { SQLiteDatabase } from './database';
import { CSVDataPoint } from '@/types/csv-data';

export interface TimeseriesWriteOptions {
  plant: string;
  machineNo: string;
  data: CSVDataPoint[];
  batchSize?: number;
}

export interface TimeseriesReadOptions {
  plant: string;
  machineNo: string;
  startDate?: string;
  endDate?: string;
  parameters?: string[];
  limit?: number;
  offset?: number;
}

export interface TimeseriesMetadata {
  plant: string;
  machineNo: string;
  recordCount: number;
  dateRange: {
    min: string;
    max: string;
  };
  parameters: string[];
}

export class TimeseriesUtils {
  private db: SQLiteDatabase;

  constructor() {
    this.db = SQLiteDatabase.getInstance();
  }

  // 時系列データを書き込む
  async writeTimeseries(options: TimeseriesWriteOptions): Promise<void> {
    const { plant, machineNo, data, batchSize = 1000 } = options;
    
    await this.db.initialize();
    const database = (this.db as any).db;
    
    if (!database) throw new Error('Database not initialized');

    // トランザクションで一括挿入
    const insertStmt = database.prepare(`
      INSERT INTO timeseries_data (plant, machine_no, timestamp, parameters)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = database.transaction((records: any[]) => {
      for (const record of records) {
        insertStmt.run(record.plant, record.machineNo, record.timestamp, record.parameters);
      }
    });

    // バッチ処理
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize).map(point => ({
        plant,
        machineNo,
        timestamp: point.timestamp,
        parameters: JSON.stringify(point)
      }));
      
      insertMany(batch);
    }
  }

  // 時系列データを読み込む
  async readTimeseries(options: TimeseriesReadOptions): Promise<CSVDataPoint[]> {
    const { plant, machineNo, startDate, endDate, parameters, limit, offset = 0 } = options;
    
    await this.db.initialize();
    const database = (this.db as any).db;
    
    if (!database) throw new Error('Database not initialized');

    let query = `
      SELECT parameters 
      FROM timeseries_data 
      WHERE plant = ? AND machine_no = ?
    `;
    
    const queryParams: any[] = [plant, machineNo];

    if (startDate) {
      query += ' AND timestamp >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      queryParams.push(endDate);
    }

    query += ' ORDER BY timestamp';

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
    }

    const stmt = database.prepare(query);
    const rows = stmt.all(...queryParams) as any[];

    // JSONをパースして、必要なパラメータのみフィルタリング
    return rows.map(row => {
      const data = JSON.parse(row.parameters);
      
      if (parameters && parameters.length > 0) {
        // 指定されたパラメータのみを抽出
        const filtered: CSVDataPoint = { timestamp: data.timestamp };
        for (const param of parameters) {
          if (param in data) {
            filtered[param] = data[param];
          }
        }
        return filtered;
      }
      
      return data;
    });
  }

  // メタデータを取得
  async getMetadata(plant: string, machineNo: string): Promise<TimeseriesMetadata | null> {
    await this.db.initialize();
    const database = (this.db as any).db;
    
    if (!database) throw new Error('Database not initialized');

    const metaStmt = database.prepare(`
      SELECT 
        COUNT(*) as count,
        MIN(timestamp) as min_timestamp,
        MAX(timestamp) as max_timestamp
      FROM timeseries_data
      WHERE plant = ? AND machine_no = ?
    `);

    const meta = metaStmt.get(plant, machineNo) as any;
    
    if (!meta || meta.count === 0) {
      return null;
    }

    // パラメータ一覧を取得（最初の100件から抽出）
    const paramStmt = database.prepare(`
      SELECT parameters 
      FROM timeseries_data 
      WHERE plant = ? AND machine_no = ?
      LIMIT 100
    `);

    const paramRows = paramStmt.all(plant, machineNo) as any[];
    const parameterSet = new Set<string>();

    for (const row of paramRows) {
      const data = JSON.parse(row.parameters);
      Object.keys(data).forEach(key => {
        if (key !== 'timestamp') {
          parameterSet.add(key);
        }
      });
    }

    return {
      plant,
      machineNo,
      recordCount: meta.count,
      dateRange: {
        min: meta.min_timestamp,
        max: meta.max_timestamp
      },
      parameters: Array.from(parameterSet)
    };
  }

  // データを削除
  async deleteTimeseries(plant: string, machineNo: string, startDate?: string, endDate?: string): Promise<number> {
    await this.db.initialize();
    const database = (this.db as any).db;
    
    if (!database) throw new Error('Database not initialized');

    let query = 'DELETE FROM timeseries_data WHERE plant = ? AND machine_no = ?';
    const queryParams: any[] = [plant, machineNo];

    if (startDate) {
      query += ' AND timestamp >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      queryParams.push(endDate);
    }

    const stmt = database.prepare(query);
    const result = stmt.run(...queryParams);
    
    return result.changes;
  }

  // データの存在確認
  async exists(plant: string, machineNo: string): Promise<boolean> {
    await this.db.initialize();
    const database = (this.db as any).db;
    
    if (!database) throw new Error('Database not initialized');

    const stmt = database.prepare(`
      SELECT 1 FROM timeseries_data 
      WHERE plant = ? AND machine_no = ?
      LIMIT 1
    `);

    const result = stmt.get(plant, machineNo);
    return !!result;
  }

  // 統計情報を取得
  async getStatistics(): Promise<any[]> {
    await this.db.initialize();
    const database = (this.db as any).db;
    
    if (!database) throw new Error('Database not initialized');

    const stmt = database.prepare(`
      SELECT 
        plant,
        machine_no,
        COUNT(*) as record_count,
        MIN(timestamp) as start_date,
        MAX(timestamp) as end_date,
        COUNT(DISTINCT DATE(timestamp)) as unique_days
      FROM timeseries_data
      GROUP BY plant, machine_no
      ORDER BY plant, machine_no
    `);

    return stmt.all() as any[];
  }
}