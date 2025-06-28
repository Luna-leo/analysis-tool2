import { Database } from 'duckdb';
import { DuckDBConnection } from './connection';
import path from 'path';
import fs from 'fs/promises';
import { CSVDataPoint } from '@/types/csv-data';

export interface ParquetWriteOptions {
  plant: string;
  machineNo: string;
  yearMonth: string; // YYYY-MM format
  data: CSVDataPoint[];
  append?: boolean;
}

export interface ParquetReadOptions {
  plant: string;
  machineNo: string;
  startDate?: string;
  endDate?: string;
  parameters?: string[];
  limit?: number;
}

export class ParquetUtils {
  private connection: DuckDBConnection;

  constructor() {
    this.connection = DuckDBConnection.getInstance();
  }

  // CSVDataPointの配列をParquetファイルに書き込む
  async writeToParquet(options: ParquetWriteOptions): Promise<void> {
    const { plant, machineNo, yearMonth, data, append = false } = options;
    const db = this.connection.getDatabase();
    const parquetPath = this.connection.getParquetPath(plant, machineNo, yearMonth);

    // ディレクトリを確認・作成
    await fs.mkdir(path.dirname(parquetPath), { recursive: true });

    // ファイルの存在確認を先に行う
    const fileExists = await this.fileExists(parquetPath);

    return new Promise((resolve, reject) => {
      db.run(`
        CREATE OR REPLACE TEMPORARY TABLE temp_data AS
        SELECT * FROM (VALUES ${this.generateValuesClause(data)}) AS t(${this.generateColumnsClause(data)})
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }

        const writeQuery = append && fileExists
          ? `
            CREATE OR REPLACE TEMPORARY TABLE existing_data AS
            SELECT * FROM read_parquet('${parquetPath}');
            
            CREATE OR REPLACE TEMPORARY TABLE merged_data AS
            SELECT * FROM existing_data
            UNION ALL
            SELECT * FROM temp_data;
            
            COPY merged_data TO '${parquetPath}' (FORMAT PARQUET, COMPRESSION 'SNAPPY');
          `
          : `COPY temp_data TO '${parquetPath}' (FORMAT PARQUET, COMPRESSION 'SNAPPY');`;

        db.run(writeQuery, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  // Parquetファイルからデータを読み込む
  async readFromParquet(options: ParquetReadOptions): Promise<CSVDataPoint[]> {
    const { plant, machineNo, startDate, endDate, parameters, limit } = options;
    const db = this.connection.getDatabase();
    
    // 該当する年月のファイルを特定
    const parquetFiles = await this.findParquetFiles(plant, machineNo, startDate, endDate);
    
    if (parquetFiles.length === 0) {
      return [];
    }

    return new Promise((resolve, reject) => {
      let query = `
        SELECT ${parameters ? parameters.join(', ') : '*'}
        FROM read_parquet([${parquetFiles.map(f => `'${f}'`).join(', ')}])
      `;

      const conditions: string[] = [];
      if (startDate) {
        conditions.push(`timestamp >= '${startDate}'`);
      }
      if (endDate) {
        conditions.push(`timestamp <= '${endDate}'`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ' ORDER BY timestamp';

      if (limit) {
        query += ` LIMIT ${limit}`;
      }

      db.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as CSVDataPoint[]);
        }
      });
    });
  }

  // 指定期間に該当するParquetファイルを検索
  private async findParquetFiles(
    plant: string,
    machineNo: string,
    startDate?: string,
    endDate?: string
  ): Promise<string[]> {
    const baseDir = path.dirname(this.connection.getParquetPath(plant, machineNo, ''));
    
    try {
      const files = await fs.readdir(baseDir);
      const parquetFiles = files
        .filter(f => f.endsWith('.parquet'))
        .map(f => path.join(baseDir, f));

      if (!startDate && !endDate) {
        return parquetFiles;
      }

      // 日付範囲でフィルタリング
      return parquetFiles.filter(file => {
        const yearMonth = path.basename(file, '.parquet');
        if (startDate && yearMonth < startDate.substring(0, 7)) return false;
        if (endDate && yearMonth > endDate.substring(0, 7)) return false;
        return true;
      });
    } catch (error) {
      // ディレクトリが存在しない場合
      return [];
    }
  }

  // データからVALUES句を生成
  private generateValuesClause(data: CSVDataPoint[]): string {
    return data.map(row => {
      const values = Object.values(row).map(v => {
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        return v;
      });
      return `(${values.join(', ')})`;
    }).join(', ');
  }

  // データからカラム定義を生成
  private generateColumnsClause(data: CSVDataPoint[]): string {
    if (data.length === 0) return '';
    const columns = Object.keys(data[0]);
    return columns.map(col => `"${col}"`).join(', ');
  }

  // ファイルの存在確認
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // メタデータの更新
  async updateMetadata(plant: string, machineNo: string, yearMonth: string): Promise<void> {
    const catalogPath = this.connection.getCatalogPath();
    const catalogDb = new Database(catalogPath);

    return new Promise((resolve, reject) => {
      catalogDb.run(`
        CREATE TABLE IF NOT EXISTS metadata (
          plant TEXT,
          machine_no TEXT,
          year_month TEXT,
          record_count INTEGER,
          start_timestamp TEXT,
          end_timestamp TEXT,
          parameters TEXT,
          file_size INTEGER,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (plant, machine_no, year_month)
        )
      `, (err) => {
        if (err) {
          catalogDb.close();
          reject(err);
          return;
        }

        const parquetPath = this.connection.getParquetPath(plant, machineNo, yearMonth);
        
        // Parquetファイルからメタデータを取得して更新
        catalogDb.run(`
          INSERT OR REPLACE INTO metadata (
            plant, machine_no, year_month, record_count, 
            start_timestamp, end_timestamp, parameters, file_size
          )
          SELECT 
            '${plant}' as plant,
            '${machineNo}' as machine_no,
            '${yearMonth}' as year_month,
            COUNT(*) as record_count,
            MIN(timestamp) as start_timestamp,
            MAX(timestamp) as end_timestamp,
            JSON_GROUP_ARRAY(DISTINCT column_name) as parameters,
            0 as file_size
          FROM (
            SELECT * FROM read_parquet('${parquetPath}')
          ) t, 
          (SELECT column_name FROM parquet_schema('${parquetPath}') WHERE column_name != 'timestamp')
        `, (err) => {
          catalogDb.close();
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }
}