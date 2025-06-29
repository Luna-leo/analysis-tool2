'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/utils/api/client';
import { DataManager } from '@/components/server-sync/DataManager';

export function ServerSyncTab() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const { toast } = useToast();

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
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">サーバー連携</h1>
        <div className="flex justify-center">
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">サーバー連携</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            ログイン中: {user?.username}
          </span>
          <Button variant="outline" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
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

        <TabsContent value="upload">
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