'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Upload, Database, AlertCircle, RefreshCw, Eye, Plus, ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCSVDataStore } from '@/stores/useCSVDataStore';
import { CSVDataPoint } from '@/types/csv-data';
import { apiClient } from '@/utils/api/client';

interface DatasetOption {
  periodId: string;
  plant: string;
  machineNo: string;
  dataSourceType: string;
  recordCount: number;
  lastUpdated: string;
  selected: boolean;
}

interface DatasetGroup {
  plant: string;
  machineNo: string;
  datasets: DatasetOption[];
  totalRecords: number;
  expanded: boolean;
  groupSelected: boolean;
}

type UploadMode = 'append' | 'sync';

export function DataManager() {
  const [datasetGroups, setDatasetGroups] = useState<DatasetGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState<UploadMode>('append');
  const [previewData, setPreviewData] = useState<{ dataset: DatasetOption; data: CSVDataPoint[]; parameters: string[] } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();
  const csvStore = useCSVDataStore();

  const loadDatasets = async () => {
    setIsLoading(true);
    try {
      // IndexedDBからデータを再読み込み
      await csvStore.loadFromIndexedDB();
      
      // データセットを取得
      const datasetsMap = csvStore.datasets;
      const datasetOptions: DatasetOption[] = [];

      for (const [periodId, dataset] of datasetsMap) {
        // 各データセットのレコード数を取得
        const data = await csvStore.getParameterData(periodId, dataset.parameters);
        
        datasetOptions.push({
          periodId,
          plant: dataset.plant,
          machineNo: dataset.machineNo,
          dataSourceType: dataset.dataSourceType,
          recordCount: data?.length || 0,
          lastUpdated: dataset.lastUpdated,
          selected: false
        });
      }

      // プラント・機械番号でグループ化
      const groupMap = new Map<string, DatasetGroup>();
      
      datasetOptions.forEach(dataset => {
        const key = `${dataset.plant}-${dataset.machineNo}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            plant: dataset.plant,
            machineNo: dataset.machineNo,
            datasets: [],
            totalRecords: 0,
            expanded: false,
            groupSelected: false
          });
        }
        const group = groupMap.get(key)!;
        group.datasets.push(dataset);
        group.totalRecords += dataset.recordCount;
      });

      // 各グループ内のデータセットをlastUpdatedでソート（新しい順）
      groupMap.forEach(group => {
        group.datasets.sort((a, b) => 
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
      });

      // グループを配列に変換してソート
      const groups = Array.from(groupMap.values()).sort((a, b) => {
        const plantCompare = a.plant.localeCompare(b.plant);
        if (plantCompare !== 0) return plantCompare;
        return a.machineNo.localeCompare(b.machineNo);
      });

      setDatasetGroups(groups);
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'データの読み込みに失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const toggleGroupExpanded = (groupIndex: number) => {
    setDatasetGroups(prev => prev.map((group, index) => 
      index === groupIndex ? { ...group, expanded: !group.expanded } : group
    ));
  };

  const toggleGroupSelection = (groupIndex: number) => {
    setDatasetGroups(prev => prev.map((group, index) => {
      if (index === groupIndex) {
        const newGroupSelected = !group.groupSelected;
        return {
          ...group,
          groupSelected: newGroupSelected,
          datasets: group.datasets.map(ds => ({ ...ds, selected: newGroupSelected }))
        };
      }
      return group;
    }));
  };

  const toggleDatasetSelection = (groupIndex: number, datasetIndex: number) => {
    setDatasetGroups(prev => prev.map((group, gIndex) => {
      if (gIndex === groupIndex) {
        const newDatasets = [...group.datasets];
        newDatasets[datasetIndex] = { 
          ...newDatasets[datasetIndex], 
          selected: !newDatasets[datasetIndex].selected 
        };
        
        // グループの選択状態を更新（全て選択されていればグループも選択）
        const allSelected = newDatasets.every(ds => ds.selected);
        return {
          ...group,
          datasets: newDatasets,
          groupSelected: allSelected
        };
      }
      return group;
    }));
  };

  const toggleAllSelection = () => {
    const hasAnySelected = datasetGroups.some(group => 
      group.groupSelected || group.datasets.some(ds => ds.selected)
    );
    
    setDatasetGroups(prev => prev.map(group => ({
      ...group,
      groupSelected: !hasAnySelected,
      datasets: group.datasets.map(ds => ({ ...ds, selected: !hasAnySelected }))
    })));
  };

  const handlePreview = async (dataset: DatasetOption) => {
    try {
      const csvDataset = csvStore.getCSVData(dataset.periodId);
      if (!csvDataset) {
        toast({
          title: 'エラー',
          description: 'データが見つかりません',
          variant: 'destructive'
        });
        return;
      }

      // プレビュー用に最初の10件を取得
      const allData = await csvStore.getParameterData(dataset.periodId, csvDataset.parameters);
      if (!allData || allData.length === 0) {
        toast({
          title: '情報',
          description: 'プレビューできるデータがありません',
        });
        return;
      }

      const previewRows = allData.slice(0, 10);
      setPreviewData({
        dataset,
        data: previewRows,
        parameters: csvDataset.parameters
      });
      setIsPreviewOpen(true);
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'データのプレビューに失敗しました',
        variant: 'destructive'
      });
    }
  };

  const handleUpload = async () => {
    const selectedDatasets = datasetGroups.flatMap(group => 
      group.datasets.filter(ds => ds.selected)
    );
    
    if (selectedDatasets.length === 0) {
      toast({
        title: 'エラー',
        description: 'アップロードするデータを選択してください',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let totalRecords = 0;
      let uploadedDatasets = 0;

      for (const dataset of selectedDatasets) {
        // データセットの詳細情報を取得
        const csvDataset = csvStore.getCSVData(dataset.periodId);
        if (!csvDataset) continue;

        // データポイントを取得
        const dataPoints = await csvStore.getParameterData(
          dataset.periodId, 
          csvDataset.parameters
        );
        
        if (!dataPoints || dataPoints.length === 0) continue;

        // バッチサイズを定義
        const batchSize = 1000;
        let isFirstBatch = true;
        
        for (let i = 0; i < dataPoints.length; i += batchSize) {
          const batch = dataPoints.slice(i, i + batchSize);

          if (uploadMode === 'sync') {
            // 同期モード: /api/data/syncエンドポイントを使用
            const response = await apiClient.post('/api/data/sync', {
              plant: dataset.plant,
              machineNo: dataset.machineNo,
              data: batch,
              clearExisting: isFirstBatch && uploadedDatasets === 0 // 最初のバッチの時のみクリア
            });

            if (response.error) {
              throw new Error(response.error.message);
            }
          } else {
            // 追加モード: /api/data/upload-indexedエンドポイントを使用
            const response = await fetch('/api/data/upload-indexed', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
              },
              body: JSON.stringify({
                plant: dataset.plant,
                machineNo: dataset.machineNo,
                sourceType: dataset.dataSourceType,
                data: batch,
                parameters: csvDataset.parameters,
                units: csvDataset.units
              })
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'アップロードに失敗しました');
            }
          }

          isFirstBatch = false;
          totalRecords += batch.length;
        }

        uploadedDatasets++;
        setUploadProgress((uploadedDatasets / selectedDatasets.length) * 100);
      }

      const actionText = uploadMode === 'sync' ? '同期' : 'アップロード';
      toast({
        title: `${actionText}完了`,
        description: `${selectedDatasets.length}件のデータセット、計${totalRecords}件のレコードを${actionText}しました`
      });

      // 選択状態をリセット
      setDatasetGroups(prev => prev.map(group => ({
        ...group,
        groupSelected: false,
        datasets: group.datasets.map(ds => ({ ...ds, selected: false }))
      })));
      setUploadProgress(0);

    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'データ転送に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedCount = datasetGroups.reduce((total, group) => 
    total + group.datasets.filter(ds => ds.selected).length, 0
  );
  const totalDatasets = datasetGroups.reduce((total, group) => 
    total + group.datasets.length, 0
  );
  const actionText = uploadMode === 'sync' ? '同期' : 'アップロード';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>IndexedDBデータ管理</CardTitle>
          <CardDescription>
            ローカルに保存されているデータをサーバーにアップロード・同期
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {datasetGroups.length}件のプラント・機械番号、{totalDatasets}件のデータセット
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDatasets}
              disabled={isLoading || isUploading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </div>

          {/* アップロードモード選択 */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              アップロードモード
            </h4>
            <RadioGroup value={uploadMode} onValueChange={(value) => setUploadMode(value as UploadMode)}>
              <div className="flex items-start space-x-2 mb-3">
                <RadioGroupItem value="append" id="append" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="append" className="flex items-center gap-2 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    追加アップロード
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    サーバーの既存データを保持したまま、新しいデータを追加します
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="sync" id="sync" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="sync" className="flex items-center gap-2 cursor-pointer">
                    <ArrowUpDown className="h-4 w-4" />
                    完全同期
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    サーバーの既存データを削除してから、選択したデータで置き換えます
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">データを読み込み中...</span>
              </div>
            </div>
          ) : datasetGroups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                アップロード可能なデータがありません
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg divide-y max-h-[calc(100vh-500px)] min-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                <div className="p-3 bg-muted/50 flex items-center gap-2 sticky top-0 z-10">
                  <Checkbox
                    checked={datasetGroups.length > 0 && datasetGroups.every(group => group.groupSelected)}
                    onCheckedChange={toggleAllSelection}
                    disabled={isUploading}
                  />
                  <span className="text-sm font-medium">すべて選択</span>
                </div>
                {datasetGroups.map((group, groupIndex) => (
                  <div key={`${group.plant}-${group.machineNo}`} className="divide-y">
                    <div className="p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={group.groupSelected}
                        onCheckedChange={() => toggleGroupSelection(groupIndex)}
                        disabled={isUploading}
                      />
                      <button
                        onClick={() => toggleGroupExpanded(groupIndex)}
                        className="flex items-center gap-1 flex-1 text-left"
                      >
                        {group.expanded ? 
                          <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        }
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{group.plant}</span>
                            <span className="text-muted-foreground">-</span>
                            <span className="font-medium">{group.machineNo}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {group.datasets.length}件のデータセット、合計{group.totalRecords.toLocaleString()}件
                          </div>
                        </div>
                      </button>
                    </div>
                    {group.expanded && (
                      <div className="bg-muted/10">
                        {group.datasets.map((dataset, datasetIndex) => (
                          <div
                            key={dataset.periodId}
                            className="pl-12 pr-3 py-2 flex items-center gap-3 hover:bg-muted/20 transition-colors border-b border-muted/20 last:border-0"
                          >
                            <Checkbox
                              checked={dataset.selected}
                              onCheckedChange={() => toggleDatasetSelection(groupIndex, datasetIndex)}
                              disabled={isUploading}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-4 text-sm">
                                <span>{formatDate(dataset.lastUpdated)} インポート</span>
                                <span className="text-muted-foreground">({dataset.recordCount.toLocaleString()}件)</span>
                                <span className="text-muted-foreground">[{dataset.dataSourceType}]</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(dataset)}
                              disabled={isUploading}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedCount > 0 && (
                <div className="text-sm text-muted-foreground text-center">
                  {selectedCount}件のデータセットが選択されています
                </div>
              )}
            </>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                {actionText}中... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={selectedCount === 0 || isUploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? `${actionText}中...` : `選択したデータを${actionText}${selectedCount > 0 ? ` (${selectedCount}件)` : ''}`}
          </Button>

          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              プラント・機械番号ごとにグループ化されています。
              {uploadMode === 'sync' 
                ? '完全同期モードでは、サーバー上の既存データが削除されます。' 
                : '追加アップロードモードでは、既存データに新しいデータが追加されます。'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>データプレビュー</DialogTitle>
            <DialogDescription>
              {previewData && (
                <>
                  {previewData.dataset.plant} - {previewData.dataset.machineNo} 
                  ({previewData.dataset.recordCount.toLocaleString()}件中最初の10件)
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
            {previewData && (
              <div className="min-w-full">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">Timestamp</TableHead>
                    {previewData.parameters.map(param => (
                      <TableHead key={param} className="sticky top-0 bg-background">
                        {param}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {new Date(row.timestamp).toLocaleString('ja-JP')}
                      </TableCell>
                      {previewData.parameters.map(param => (
                        <TableCell key={param} className="font-mono text-sm">
                          {row[param] !== undefined ? 
                            typeof row[param] === 'number' ? 
                              (row[param] as number).toFixed(2) : 
                              String(row[param])
                            : '-'
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}