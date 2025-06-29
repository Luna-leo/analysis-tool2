import { NextRequest } from 'next/server';

// Node.js Runtimeを使用（Edge Runtimeを回避）
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // 動的インポートでハンドラーを読み込む
  const { handler } = await import('./handler');
  return handler(request);
}