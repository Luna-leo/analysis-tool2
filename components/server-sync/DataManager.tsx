'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, Database, AlertCircle, RefreshCw, Eye, Plus, ArrowUpDown, ChevronDown, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';
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
  const [deleteConfirmData, setDeleteConfirmData] = useState<DatasetOption | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const csvStore = useCSVDataStore();
  const datasetGroupsRef = useRef<DatasetGroup[]>([]);

  const loadDatasets = async () => {
    setIsLoading(true);
    try {
      // IndexedDBからデータを再読み込み
      await csvStore.loadFromIndexedDB();
      
      // データセットを取得
      const datasetsMap = csvStore.datasets;
      const datasetOptions: DatasetOption[] = [];

      for (const [periodId, dataset] of datasetsMap) {
        datasetOptions.push({
          periodId,
          plant: dataset.plant,
          machineNo: dataset.machineNo,
          dataSourceType: dataset.dataSourceType,
          recordCount: dataset.recordCount || 0, // 保存されているレコード数を使用
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
    
    // クリーンアップ: コンポーネントアンマウント時にメモリをクリア
    return () => {
      // refから現在のデータセットを取得
      const periodIds = datasetGroupsRef.current.flatMap(group => 
        group.datasets.map(ds => ds.periodId)
      );
      
      // メモリキャッシュをクリア
      if (periodIds.length > 0) {
        csvStore.clearMemoryCache(periodIds);
      }
    };
  }, []); // 空の依存配列に変更（初回マウント時のみ実行）
  
  // datasetGroupsが変更されたらrefを更新
  useEffect(() => {
    datasetGroupsRef.current = datasetGroups;
  }, [datasetGroups]);

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

      // プレビュー用に最初の10件のみを取得（ページネーション使用）
      const result = await csvStore.getParameterDataPaginated(
        dataset.periodId, 
        csvDataset.parameters,
        1, // 最初のページ
        10 // 10件のみ
      );
      
      if (!result.data || result.data.length === 0) {
        toast({
          title: '情報',
          description: 'プレビューできるデータがありません',
        });
        return;
      }

      setPreviewData({
        dataset,
        data: result.data,
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

  const handleDeleteConfirm = (dataset: DatasetOption) => {
    setDeleteConfirmData(dataset);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmData) return;

    setIsDeleting(true);
    try {
      await csvStore.removeCSVData(deleteConfirmData.periodId);
      
      toast({
        title: '削除完了',
        description: `${deleteConfirmData.plant} - ${deleteConfirmData.machineNo} のデータを削除しました`
      });

      setIsDeleteConfirmOpen(false);
      setDeleteConfirmData(null);
      
      // データリストを再読み込み
      await loadDatasets();
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'データの削除に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAllData = async () => {
    setIsDeleting(true);
    try {
      await csvStore.clearAllData();
      
      toast({
        title: '全データ削除完了',
        description: 'IndexedDB内の全データを削除しました'
      });

      setIsClearAllConfirmOpen(false);
      
      // データリストを再読み込み
      await loadDatasets();
    } catch (error) {
      toast({
        title: 'エラー',
        description: '全データの削除に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
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

        // バッチサイズを定義
        const batchSize = 1000;
        let isFirstBatch = true;
        let currentPage = 1;
        let hasMoreData = true;
        
        // ページ単位でデータを取得してアップロード
        while (hasMoreData) {
          const result = await csvStore.getParameterDataPaginated(
            dataset.periodId,
            csvDataset.parameters,
            currentPage,
            batchSize
          );
          
          if (!result.data || result.data.length === 0) {
            hasMoreData = false;
            break;
          }
          
          const batch = result.data;

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
          currentPage++;
          
          // 次のページがあるかチェック
          if (result.data.length < batchSize) {
            hasMoreData = false;
          }
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
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>IndexedDBデータ管理</CardTitle>
          <CardDescription>
            ローカルに保存されているデータをサーバーにアップロード・同期
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {datasetGroups.length}件のプラント・機械番号、{totalDatasets}件のデータセット
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <ToggleGroup type="single" value={uploadMode} onValueChange={(value) => value && setUploadMode(value as UploadMode)} className="h-8">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="append" aria-label="追加アップロード" className="h-8 px-3">
                        <Plus className="h-4 w-4 mr-1" />
                        追加
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>既存データを保持したまま新しいデータを追加</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="sync" aria-label="完全同期" className="h-8 px-3">
                        <ArrowUpDown className="h-4 w-4 mr-1" />
                        同期
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>既存データを削除してから置き換え</p>
                    </TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </TooltipProvider>
              
              <Button
                variant="outline"
                size="sm"
                onClick={loadDatasets}
                disabled={isLoading || isUploading || isDeleting}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                更新
              </Button>
              {datasetGroups.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsClearAllConfirmOpen(true)}
                  disabled={isLoading || isUploading || isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  全削除
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="inline-flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">データを読み込み中...</span>
              </div>
            </div>
          ) : datasetGroups.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  アップロード可能なデータがありません
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <div className="border rounded-lg divide-y h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                <div className="p-3 bg-muted/50 flex items-center gap-2 sticky top-0 z-10">
                  <Checkbox
                    checked={datasetGroups.length > 0 && datasetGroups.every(group => group.groupSelected)}
                    onCheckedChange={toggleAllSelection}
                    disabled={isUploading || isDeleting}
                  />
                  <span className="text-sm font-medium">すべて選択</span>
                </div>
                {datasetGroups.map((group, groupIndex) => (
                  <div key={`${group.plant}-${group.machineNo}`} className="divide-y">
                    <div className="p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={group.groupSelected}
                        onCheckedChange={() => toggleGroupSelection(groupIndex)}
                        disabled={isUploading || isDeleting}
                      />
                      <button
                        onClick={() => toggleGroupExpanded(groupIndex)}
                        className="flex items-center gap-1 flex-1 text-left hover:opacity-80 transition-opacity"
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
                              disabled={isUploading || isDeleting}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-4 text-sm">
                                <span>{formatDate(dataset.lastUpdated)} インポート</span>
                                <span className="text-muted-foreground">({dataset.recordCount.toLocaleString()}件)</span>
                                <span className="text-muted-foreground">[{dataset.dataSourceType}]</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePreview(dataset)}
                                      disabled={isUploading || isDeleting}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>プレビュー</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteConfirm(dataset)}
                                      disabled={isUploading || isDeleting}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>削除</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3 border-t">
          {selectedCount > 0 && (
            <div className="text-sm text-muted-foreground text-center w-full">
              {selectedCount}件のデータセットが選択されています
            </div>
          )}
          
          {isUploading && (
            <div className="w-full space-y-2">
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>
              {uploadMode === 'sync' 
                ? '完全同期: サーバーの既存データを削除してから置き換えます' 
                : '追加モード: 既存データに新しいデータを追加します'
              }
            </span>
          </div>
        </CardFooter>
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

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              データ削除の確認
            </DialogTitle>
            <DialogDescription>
              {deleteConfirmData && (
                <span>
                  以下のデータを削除しますか？この操作は取り消せません。
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {deleteConfirmData && (
            <div className="mt-3 p-3 bg-muted rounded-md">
              <div className="font-medium">{deleteConfirmData.plant} - {deleteConfirmData.machineNo}</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(deleteConfirmData.lastUpdated)} インポート
                （{deleteConfirmData.recordCount.toLocaleString()}件）
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  削除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isClearAllConfirmOpen} onOpenChange={setIsClearAllConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              全データ削除の確認
            </DialogTitle>
            <DialogDescription>
              IndexedDB内の全てのデータを削除しますか？
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="text-sm font-medium text-destructive">
              警告: この操作は取り消せません
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {datasetGroups.length}件のプラント・機械番号、
              合計{totalDatasets}件のデータセットが削除されます。
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClearAllConfirmOpen(false)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllData}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  削除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  全データを削除
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}