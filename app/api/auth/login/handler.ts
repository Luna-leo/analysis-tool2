import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { SQLiteDatabase } from '@/lib/server/sqlite/database';

export async function handler(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードが必要です' },
        { status: 400 }
      );
    }

    const db = SQLiteDatabase.getInstance();
    await db.initialize();

    // ユーザーを取得
    const user = db.getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: '認証に失敗しました' },
        { status: 401 }
      );
    }

    // パスワードを検証
    const isValid = await db.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: '認証に失敗しました' },
        { status: 401 }
      );
    }

    // セッションを作成
    const session = db.createSession(user.id, 24); // 24時間有効

    // レスポンスを作成
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: session.token
    });

    // Cookieにトークンを設定
    response.cookies.set('auth-token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24時間
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}