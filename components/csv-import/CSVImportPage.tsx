"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, FileText, Download, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CSVDataSourceType } from "@/types"
import { parseCSVFiles, validateCSVStructure, mapCSVDataToStandardFormat, ParsedCSVData } from "@/utils/csvUtils"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CSVImportPageProps {
  fileId: string
}

interface ImportStatus {
  fileName: string
  status: 'pending' | 'processing' | 'success' | 'error'
  message?: string
  rowCount?: number
}

export function CSVImportPage({ fileId }: CSVImportPageProps) {
  const [dataSourceType, setDataSourceType] = useState<CSVDataSourceType>("SSAC")
  const [plant, setPlant] = useState("")
  const [machineNo, setMachineNo] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([])
  const [parsedData, setParsedData] = useState<ParsedCSVData[]>([])
  const [activePreviewIndex, setActivePreviewIndex] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const csvFiles = Array.from(selectedFiles).filter(file => 
        file.name.endsWith('.csv') || file.name.endsWith('.CSV')
      )
      setFiles(csvFiles)
      setImportStatuses([])
      setParsedData([])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.name.endsWith('.csv') || file.name.endsWith('.CSV')
    )
    setFiles(droppedFiles)
    setImportStatuses([])
    setParsedData([])
  }, [])

  const handleValidate = async () => {
    if (!plant || !machineNo || files.length === 0) {
      toast({
        title: "入力エラー",
        description: "すべての必須項目を入力してください",
        variant: "destructive",
      })
      return
    }

    const statuses: ImportStatus[] = files.map(file => ({
      fileName: file.name,
      status: 'pending'
    }))
    setImportStatuses(statuses)

    try {
      // Parse CSV files
      const parseResult = await parseCSVFiles(files)
      
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || "CSV解析に失敗しました")
      }

      setParsedData(parseResult.data)
      
      // Validate each file
      const updatedStatuses: ImportStatus[] = []
      
      for (let i = 0; i < parseResult.data.length; i++) {
        const parsedFile = parseResult.data[i]
        const validation = validateCSVStructure(parsedFile.headers, dataSourceType)
        
        if (validation.valid) {
          updatedStatuses.push({
            fileName: parsedFile.metadata.fileName,
            status: 'success',
            message: '検証成功',
            rowCount: parsedFile.metadata.rowCount
          })
        } else {
          updatedStatuses.push({
            fileName: parsedFile.metadata.fileName,
            status: 'error',
            message: `必須カラムが不足: ${validation.missingColumns?.join(', ')}`
          })
        }
      }
      
      setImportStatuses(updatedStatuses)
    } catch (error) {
      toast({
        title: "検証エラー",
        description: error instanceof Error ? error.message : "CSV検証中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    const validFiles = importStatuses.filter(s => s.status === 'success')
    if (validFiles.length === 0) {
      toast({
        title: "インポートエラー",
        description: "インポート可能なファイルがありません",
        variant: "destructive",
      })
      return
    }

    try {
      let totalRowsImported = 0
      
      for (const parsedFile of parsedData) {
        const status = importStatuses.find(s => s.fileName === parsedFile.metadata.fileName)
        if (status?.status !== 'success') continue

        // Map data to standard format
        const standardData = mapCSVDataToStandardFormat(
          parsedFile,
          dataSourceType,
          plant,
          machineNo
        )

        // TODO: Save to database or data store
        console.log('Imported data:', standardData)
        totalRowsImported += standardData.length
      }

      toast({
        title: "インポート完了",
        description: `${validFiles.length}個のファイルから${totalRowsImported}件のデータをインポートしました`,
      })

      // Reset form
      setFiles([])
      setImportStatuses([])
      setParsedData([])
    } catch (error) {
      toast({
        title: "インポートエラー",
        description: error instanceof Error ? error.message : "インポート中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const isValid = plant && machineNo && files.length > 0

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">CSV Import</h2>
        <p className="text-muted-foreground">CSVファイルをインポートしてデータを取り込みます</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left Column - Import Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>インポート設定</CardTitle>
              <CardDescription>データソースの種類と基本情報を設定してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data Source Type Selection */}
              <div className="space-y-2">
                <Label>データソースの種類</Label>
                <RadioGroup value={dataSourceType} onValueChange={(value) => setDataSourceType(value as CSVDataSourceType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SSAC" id="ssac" />
                    <Label htmlFor="ssac">SSAC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SCA" id="sca" />
                    <Label htmlFor="sca">SCA</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="INOMOT" id="inomot" />
                    <Label htmlFor="inomot">INOMOT</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Plant and Machine No */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plant">Plant</Label>
                  <Input
                    id="plant"
                    value={plant}
                    onChange={(e) => setPlant(e.target.value)}
                    placeholder="例: Plant A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="machineNo">Machine No</Label>
                  <Input
                    id="machineNo"
                    value={machineNo}
                    onChange={(e) => setMachineNo(e.target.value)}
                    placeholder="例: M-001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ファイル選択</CardTitle>
              <CardDescription>CSVファイルを選択またはドラッグ＆ドロップしてください</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
                  ${files.length > 0 ? 'bg-gray-50' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {files.length === 0 ? (
                  <>
                    <Upload className="mx-auto h-16 w-16 text-gray-400" />
                    <p className="mt-4 text-sm text-gray-600">
                      CSVファイルをドラッグ＆ドロップ
                    </p>
                    <p className="mt-1 text-sm text-gray-600">または</p>
                    <div className="mt-4 flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        ファイルを選択
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => folderInputRef.current?.click()}
                      >
                        フォルダを選択
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.CSV"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <input
                      ref={folderInputRef}
                      type="file"
                      accept=".csv,.CSV"
                      multiple
                      {...{ webkitdirectory: "" } as any}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </>
                ) : (
                  <div className="space-y-4">
                    <FileText className="mx-auto h-16 w-16 text-primary" />
                    <p className="text-sm font-medium">{files.length}個のファイルが選択されました</p>
                    <ScrollArea className="h-32 w-full rounded border p-2">
                      <div className="space-y-1">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate">{file.name}</span>
                            <span className="text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFiles([])
                        setImportStatuses([])
                        setParsedData([])
                      }}
                    >
                      クリア
                    </Button>
                  </div>
                )}
              </div>

              {files.length > 0 && (
                <div className="mt-4 flex gap-2 justify-end">
                  <Button
                    onClick={handleValidate}
                    disabled={!isValid}
                  >
                    検証
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importStatuses.filter(s => s.status === 'success').length === 0}
                    variant="default"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    インポート
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview and Status */}
        <div className="space-y-6">
          {importStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>検証結果</CardTitle>
                <CardDescription>各ファイルの検証状態</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {importStatuses.map((status, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => setActivePreviewIndex(index)}
                    >
                      <div className="flex items-center gap-3">
                        {status.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : status.status === 'error' ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{status.fileName}</p>
                          {status.message && (
                            <p className="text-xs text-muted-foreground">{status.message}</p>
                          )}
                        </div>
                      </div>
                      {status.rowCount !== undefined && (
                        <Badge variant="secondary">{status.rowCount}行</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {parsedData.length > 0 && (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>データプレビュー</CardTitle>
                <CardDescription>
                  {parsedData[activePreviewIndex]?.metadata.fileName} - 最初の10行
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {parsedData[activePreviewIndex]?.headers.map((header, index) => (
                          <TableHead key={index} className="whitespace-nowrap">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData[activePreviewIndex]?.rows.slice(0, 10).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex} className="whitespace-nowrap">
                              {cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}