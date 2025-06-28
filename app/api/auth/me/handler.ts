import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { SQLiteDatabase } from '@/lib/server/sqlite/database';

export async function handler(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const db = SQLiteDatabase.getInstance();
    await db.initialize();

    // セッションを取得
    const session = db.getSessionByToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'セッションが無効です' },
        { status: 401 }
      );
    }

    // ユーザー情報を取得
    const user = db.getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}