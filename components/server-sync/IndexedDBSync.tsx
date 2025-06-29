'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Database, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/utils/api/client';
import { CSVDataPoint } from '@/types/csv-data';
import { useCSVDataStore } from '@/stores/useCSVDataStore';

export function IndexedDBSync() {
  const [plant, setPlant] = useState('');
  const [machineNo, setMachineNo] = useState('');
  const [clearExisting, setClearExisting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const { toast } = useToast();

  const handleSync = async () => {
    if (!plant || !machineNo) {
      toast({
        title: 'エラー',
        description: 'プラントと機械番号を入力してください',
        variant: 'destructive'
      });
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // IndexedDBからデータを取得
      setSyncProgress(10);
      
      // 現在のストアからデータを取得
      const datasets = useCSVDataStore.getState().datasets;
      
      if (datasets.size === 0) {
        toast({
          title: '情報',
          description: 'ローカルにデータがありません',
        });
        return;
      }

      setSyncProgress(30);

      // 最初のデータセットを使用（実際の実装では選択UIが必要）
      const firstDataset = Array.from(datasets.values())[0];
      const formattedData: CSVDataPoint[] = firstDataset.data;

      // バッチサイズを定義
      const batchSize = 1000;
      let totalSynced = 0;

      // バッチごとに送信
      for (let i = 0; i < formattedData.length; i += batchSize) {
        const batch = formattedData.slice(i, i + batchSize);
        const isFirstBatch = i === 0;

        const response = await apiClient.post('/api/data/sync', {
          plant,
          machineNo,
          data: batch,
          clearExisting: isFirstBatch && clearExisting
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        totalSynced += batch.length;
        setSyncProgress(30 + (totalSynced / formattedData.length) * 60);
      }

      setSyncProgress(100);

      toast({
        title: '同期完了',
        description: `${totalSynced}件のデータを同期しました`
      });

      // リセット
      setPlant('');
      setMachineNo('');
      setClearExisting(false);
      setSyncProgress(0);

    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '同期に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>IndexedDBデータ同期</CardTitle>
        <CardDescription>
          ローカルの時系列データをサーバーに同期
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sync-plant">プラント</Label>
            <Input
              id="sync-plant"
              placeholder="例: TestPlant"
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              disabled={isSyncing}
            />
          </div>
          <div>
            <Label htmlFor="sync-machineNo">機械番号</Label>
            <Input
              id="sync-machineNo"
              placeholder="例: M001"
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              disabled={isSyncing}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">既存データをクリア</p>
              <p className="text-sm text-muted-foreground">
                サーバー上の既存データを削除してから同期
              </p>
            </div>
          </div>
          <Switch
            checked={clearExisting}
            onCheckedChange={setClearExisting}
            disabled={isSyncing}
          />
        </div>

        {isSyncing && (
          <div className="space-y-2">
            <Progress value={syncProgress} />
            <p className="text-sm text-center text-muted-foreground">
              同期中... {Math.round(syncProgress)}%
            </p>
          </div>
        )}

        <Button
          onClick={handleSync}
          disabled={!plant || !machineNo || isSyncing}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isSyncing ? '同期中...' : 'データを同期'}
        </Button>

        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            ローカルのIndexedDBに保存されているすべてのデータが
            指定したプラント・機械番号として同期されます。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}