#!/usr/bin/env tsx
import { SQLiteDatabase } from '../lib/server/sqlite/database';
import dotenv from 'dotenv';
import path from 'path';

// 環境変数を読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function initializeDatabase() {
  console.log('🚀 データベース初期化を開始します...');
  
  const db = SQLiteDatabase.getInstance();
  
  try {
    // データベースを初期化
    await db.initialize();
    console.log('✅ データベースの初期化が完了しました');
    
    // テストユーザーが存在するか確認
    const existingUser = db.getUserByUsername('testuser');
    
    if (existingUser) {
      console.log('ℹ️  テストユーザー (testuser) は既に存在します');
    } else {
      // テストユーザーを作成
      await db.createUser(
        'testuser',
        'testuser@example.com',
        'password123',
        'user'
      );
      console.log('✅ テストユーザー (testuser) を作成しました');
      console.log('   ユーザー名: testuser');
      console.log('   パスワード: password123');
    }
    
    // 本番環境用の管理者ユーザーを作成する場合（オプション）
    if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
      const adminUser = db.getUserByUsername(process.env.ADMIN_USERNAME);
      
      if (!adminUser) {
        await db.createUser(
          process.env.ADMIN_USERNAME,
          process.env.ADMIN_EMAIL || `${process.env.ADMIN_USERNAME}@example.com`,
          process.env.ADMIN_PASSWORD,
          'admin'
        );
        console.log(`✅ 管理者ユーザー (${process.env.ADMIN_USERNAME}) を作成しました`);
      } else {
        console.log(`ℹ️  管理者ユーザー (${process.env.ADMIN_USERNAME}) は既に存在します`);
      }
    }
    
    console.log('\n🎉 データベースの初期化が完了しました！');
    console.log('   サーバー連携機能でログインできるようになりました。');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// スクリプトを実行
initializeDatabase();