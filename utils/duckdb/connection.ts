import { Database } from 'duckdb';
import path from 'path';
import fs from 'fs/promises';

// DuckDB接続を管理するシングルトンクラス
export class DuckDBConnection {
  private static instance: DuckDBConnection;
  private db: Database | null = null;
  private dataPath: string;

  private constructor() {
    // データディレクトリのパスを設定
    this.dataPath = process.env.DATA_PATH || path.join(process.cwd(), 'data');
  }

  static getInstance(): DuckDBConnection {
    if (!DuckDBConnection.instance) {
      DuckDBConnection.instance = new DuckDBConnection();
    }
    return DuckDBConnection.instance;
  }

  async initialize(): Promise<void> {
    if (this.db) return;

    // データディレクトリを作成
    await this.ensureDataDirectories();

    // DuckDBインスタンスを作成
    this.db = new Database(':memory:'); // インメモリDBとして開始、Parquetファイルを直接読み書き
  }

  private async ensureDataDirectories(): Promise<void> {
    const dirs = [
      this.dataPath,
      path.join(this.dataPath, 'timeseries'),
      path.join(this.dataPath, 'timeseries', 'parquet'),
      path.join(this.dataPath, 'timeseries', 'metadata'),
      path.join(this.dataPath, 'users'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  getDatabase(): Database {
    if (!this.db) {
      throw new Error('DuckDB not initialized. Call initialize() first.');
    }
    return this.db;
  }

  getDataPath(): string {
    return this.dataPath;
  }

  async close(): Promise<void> {
    if (this.db) {
      await new Promise<void>((resolve) => {
        this.db!.close(() => resolve());
      });
      this.db = null;
    }
  }

  // Parquetファイルのパスを生成
  getParquetPath(plant: string, machineNo: string, yearMonth: string): string {
    const sanitizedPlant = plant.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedMachine = machineNo.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(
      this.dataPath,
      'timeseries',
      'parquet',
      `${sanitizedPlant}_${sanitizedMachine}`,
      `${yearMonth}.parquet`
    );
  }

  // カタログDBのパスを取得
  getCatalogPath(): string {
    return path.join(this.dataPath, 'timeseries', 'metadata', 'catalog.duckdb');
  }
}