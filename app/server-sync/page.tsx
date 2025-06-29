'use client';

/**
 * サーバー連携の独立ページ
 * 
 * NOTE: このページは互換性のために残されています。
 * 新しい実装では、サーバー連携機能はタブシステムに統合され、
 * メインアプリケーションのタブとして開かれます。
 * 
 * 将来的にこのページは削除可能です。
 */

import { useAuthStore } from '@/stores/useAuthStore';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/utils/api/client';
import { DataManager } from '@/components/server-sync/DataManager';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ServerSyncPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleTestQuery = async () => {
    setIsQuerying(true);
    try {
      const response = await apiClient.post('/api/data/query', {
        plant: 'TestPlant',
        machineNo: 'M001',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 10
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setQueryResult(response.data);
      toast({
        title: 'データ取得成功',
        description: `${response.data.count}件のデータを取得しました`,
      });
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'データ取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'ログアウトしました',
      });
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'ログアウトに失敗しました',
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            title="メインアプリケーションに戻る"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">サーバー連携</h1>
        </div>
        <div className="flex justify-center">
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="container mx-auto p-6 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              title="メインアプリケーションに戻る"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">サーバー連携</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              ログイン中: {user?.username}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="status" className="flex-1 flex flex-col container mx-auto px-6 pb-6 overflow-hidden">
        <TabsList>
          <TabsTrigger value="status">ステータス</TabsTrigger>
          <TabsTrigger value="upload">アップロード</TabsTrigger>
          <TabsTrigger value="download">ダウンロード</TabsTrigger>
          <TabsTrigger value="test">テスト</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>接続ステータス</CardTitle>
              <CardDescription>
                サーバーとの接続状態を表示します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>認証状態:</span>
                  <span className="font-semibold text-green-600">認証済み</span>
                </div>
                <div className="flex justify-between">
                  <span>ユーザー:</span>
                  <span className="font-semibold">{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span>ロール:</span>
                  <span className="font-semibold">{user?.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="flex-1 overflow-hidden">
          <DataManager />
        </TabsContent>

        <TabsContent value="download">
          <Card>
            <CardHeader>
              <CardTitle>データダウンロード</CardTitle>
              <CardDescription>
                サーバーからデータをダウンロード
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                ダウンロード機能は実装中です
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>テストクエリ</CardTitle>
              <CardDescription>
                SQLiteデータベースのクエリテスト
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleTestQuery} disabled={isQuerying}>
                {isQuerying ? 'クエリ実行中...' : 'テストデータをクエリ'}
              </Button>
              
              {queryResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">クエリ結果:</h4>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(queryResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}