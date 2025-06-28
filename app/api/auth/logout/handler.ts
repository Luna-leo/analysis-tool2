import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { SQLiteDatabase } from '@/lib/server/sqlite/database';

export async function handler(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      const db = SQLiteDatabase.getInstance();
      await db.initialize();
      
      // セッションを削除
      db.deleteSession(token);
    }

    // レスポンスを作成
    const response = NextResponse.json({ success: true });

    // Cookieを削除
    response.cookies.delete('auth-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}