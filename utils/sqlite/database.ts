import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: number;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface AppSetting {
  key: string;
  value: string;
  userId?: number;
  updatedAt: string;
}

export class SQLiteDatabase {
  private static instance: SQLiteDatabase;
  private db: Database.Database | null = null;
  private dbPath: string;

  private constructor() {
    this.dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'users', 'app.db');
  }

  static getInstance(): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase();
    }
    return SQLiteDatabase.instance;
  }

  async initialize(): Promise<void> {
    if (this.db) return;

    // ディレクトリを作成
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });

    // データベースを開く
    this.db = new Database(this.dbPath);
    
    // テーブルを作成
    this.createTables();
  }

  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized');

    // ユーザーテーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // セッションテーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // アプリケーション設定テーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        user_id INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (key, user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // インデックスを作成
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_settings_user ON app_settings(user_id);
    `);
  }

  // ユーザー管理
  async createUser(username: string, email: string, password: string, role: 'admin' | 'user' = 'user'): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const passwordHash = await this.hashPassword(password);
    
    const stmt = this.db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(username, email, passwordHash, role);
    
    return this.getUserById(result.lastInsertRowid as number)!;
  }

  getUserById(id: number): User | null {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as any;
    
    if (!user) return null;
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.password_hash,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  getUserByUsername(username: string): User | null {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as any;
    
    if (!user) return null;
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.password_hash,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    // 簡易的なハッシュ比較（本番環境ではbcryptなどを使用すべき）
    const inputHash = await this.hashPassword(password);
    return inputHash === hash;
  }

  private async hashPassword(password: string): Promise<string> {
    // 簡易的なハッシュ（本番環境ではbcryptなどを使用すべき）
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // セッション管理
  createSession(userId: number, expiresInHours: number = 24): Session {
    if (!this.db) throw new Error('Database not initialized');

    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(sessionId, userId, token, expiresAt.toISOString());

    return {
      id: sessionId,
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  getSessionByToken(token: string): Session | null {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM sessions 
      WHERE token = ? AND expires_at > datetime('now')
    `);
    
    const session = stmt.get(token) as any;
    
    if (!session) return null;
    
    return {
      id: session.id,
      userId: session.user_id,
      token: session.token,
      expiresAt: session.expires_at,
      createdAt: session.created_at
    };
  }

  deleteSession(token: string): void {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('DELETE FROM sessions WHERE token = ?');
    stmt.run(token);
  }

  deleteExpiredSessions(): void {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')");
    stmt.run();
  }

  // 設定管理
  setSetting(key: string, value: string, userId?: number): void {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value, user_id, updated_at)
      VALUES (?, ?, ?, datetime('now'))
    `);

    stmt.run(key, value, userId || null);
  }

  getSetting(key: string, userId?: number): string | null {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT value FROM app_settings 
      WHERE key = ? AND user_id ${userId ? '= ?' : 'IS NULL'}
    `);
    
    const result = userId ? stmt.get(key, userId) : stmt.get(key);
    
    return result ? (result as any).value : null;
  }

  getUserSettings(userId: number): Record<string, string> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT key, value FROM app_settings WHERE user_id = ?
    `);
    
    const settings = stmt.all(userId) as any[];
    const result: Record<string, string> = {};
    
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    
    return result;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}