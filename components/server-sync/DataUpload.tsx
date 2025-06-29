'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/utils/api/client';

export function DataUpload() {
  const [plant, setPlant] = useState('');
  const [machineNo, setMachineNo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file || !plant || !machineNo) {
      toast({
        title: 'エラー',
        description: 'ファイル、プラント、機械番号を入力してください',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('plant', plant);
      formData.append('machineNo', machineNo);

      // プログレスを段階的に更新
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/data/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'アップロードに失敗しました');
      }

      const result = await response.json();
      setUploadProgress(100);

      toast({
        title: 'アップロード完了',
        description: `${result.recordsUploaded}件のデータをアップロードしました`
      });

      // リセット
      setFile(null);
      setPlant('');
      setMachineNo('');
      setUploadProgress(0);

    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'アップロードに失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSVファイルアップロード</CardTitle>
        <CardDescription>
          時系列データのCSVファイルをサーバーにアップロード
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="plant">プラント</Label>
            <Input
              id="plant"
              placeholder="例: TestPlant"
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <div>
            <Label htmlFor="machineNo">機械番号</Label>
            <Input
              id="machineNo"
              placeholder="例: M001"
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              disabled={isUploading}
            />
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
          `}
        >
          <input {...getInputProps()} disabled={isUploading} />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'ファイルをドロップしてください'
                  : 'CSVファイルをドラッグ&ドロップ、またはクリックして選択'}
              </p>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-center text-muted-foreground">
              アップロード中... {uploadProgress}%
            </p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || !plant || !machineNo || isUploading}
          className="w-full"
        >
          {isUploading ? 'アップロード中...' : 'アップロード'}
        </Button>

        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            CSVファイルには「timestamp」カラムが必須です。
            その他のカラムは数値データとして保存されます。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}