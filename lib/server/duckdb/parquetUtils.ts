import 'server-only';

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

        // Windowsパスをposix形式に変換
        const posixPath = parquetPath.replace(/\\/g, '/');
        
        const writeQuery = append && fileExists
          ? `
            CREATE OR REPLACE TEMPORARY TABLE existing_data AS
            SELECT * FROM read_parquet('${posixPath}');
            
            CREATE OR REPLACE TEMPORARY TABLE merged_data AS
            SELECT * FROM existing_data
            UNION ALL
            SELECT * FROM temp_data;
            
            COPY merged_data TO '${posixPath}' (FORMAT PARQUET, COMPRESSION 'SNAPPY');
          `
          : `COPY temp_data TO '${posixPath}' (FORMAT PARQUET, COMPRESSION 'SNAPPY');`;

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
      // Windowsパスをposix形式に変換（DuckDBはスラッシュ区切りを期待）
      const posixFiles = parquetFiles.map(f => f.replace(/\\/g, '/'));
      
      let query = `
        SELECT ${parameters ? parameters.join(', ') : '*'}
        FROM read_parquet([${posixFiles.map(f => `'${f}'`).join(', ')}])
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

      console.log('Found parquet files:', parquetFiles);

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
      console.error('Error finding parquet files:', error);
      console.error('Base directory:', baseDir);
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
    // DuckDBは内部的にパスを処理するので、catalogPathはそのまま使用
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
        // Windowsパスをposix形式に変換
        const posixPath = parquetPath.replace(/\\/g, '/');
        
        // Parquetファイルからメタデータを取得して更新
        catalogDb.run(`
          WITH data AS (
            SELECT * FROM read_parquet('${posixPath}')
          ),
          columns AS (
            SELECT DISTINCT column_name 
            FROM (
              SELECT name as column_name 
              FROM parquet_schema('${posixPath}')
            )
            WHERE column_name != 'timestamp'
          )
          INSERT OR REPLACE INTO metadata (
            plant, machine_no, year_month, record_count, 
            start_timestamp, end_timestamp, parameters, file_size
          )
          SELECT 
            '${plant}' as plant,
            '${machineNo}' as machine_no,
            '${yearMonth}' as year_month,
            (SELECT COUNT(*) FROM data) as record_count,
            (SELECT MIN(timestamp) FROM data) as start_timestamp,
            (SELECT MAX(timestamp) FROM data) as end_timestamp,
            (SELECT JSON_GROUP_ARRAY(column_name) FROM columns) as parameters,
            0 as file_size
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