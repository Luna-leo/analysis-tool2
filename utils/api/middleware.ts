import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { SQLiteDatabase } from '@/lib/server/sqlite/database';

type RouteHandler = (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      // Cookieからトークンを取得
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

      // リクエストヘッダーにユーザー情報を追加
      const headers = new Headers(request.headers);
      headers.set('x-user-id', user.id.toString());
      headers.set('x-user-role', user.role);

      // 認証済みリクエストとしてハンドラーを実行
      const authenticatedRequest = new NextRequest(request, { headers });
      return handler(authenticatedRequest, context);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'サーバーエラーが発生しました' },
        { status: 500 }
      );
    }
  };
}