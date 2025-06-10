"use client"

import { useState, useCallback, useRef, useEffect } from "react"

// Extend HTMLInputElement to include webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
    webkitdirectory?: string
  }
}
import { Upload, FileText, Download, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CSVDataSourceType } from "@/types"
import { getDataSourceTypes, getDataSourceConfig } from "@/data/dataSourceTypes"
import { parseCSVFiles, validateCSVStructure, mapCSVDataToStandardFormat, ParsedCSVData } from "@/utils/csvUtils"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CSVImportContentProps {
  mode?: 'page' | 'dialog'
  onImportComplete?: () => void
}

interface ImportStatus {
  fileName: string
  status: 'pending' | 'processing' | 'success' | 'error'
  message?: string
  rowCount?: number
}

// Convert wildcard pattern to regex
const wildcardToRegex = (pattern: string): RegExp => {
  const escapedPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except * and ?
    .replace(/\*/g, '.*') // * matches any characters
    .replace(/\?/g, '.') // ? matches single character
  return new RegExp(`^${escapedPattern}$`, 'i')
}

export function CSVImportContent({ mode = 'page', onImportComplete }: CSVImportContentProps) {
  const [dataSourceType, setDataSourceType] = useState<CSVDataSourceType>("SSAC")
  const [plant, setPlant] = useState("")
  const [machineNo, setMachineNo] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [allFiles, setAllFiles] = useState<File[]>([]) // All selected files before filtering
  const [fileNamePattern, setFileNamePattern] = useState("")
  const [patternType, setPatternType] = useState<"wildcard" | "regex">("wildcard")
  const [isDragging, setIsDragging] = useState(false)
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([])
  const [parsedData, setParsedData] = useState<ParsedCSVData[]>([])
  const [activePreviewIndex, setActivePreviewIndex] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Filter files based on pattern
  const filterFilesByPattern = useCallback((filesToFilter: File[]): File[] => {
    if (!fileNamePattern) return filesToFilter

    try {
      const regex = patternType === 'regex' 
        ? new RegExp(fileNamePattern, 'i')
        : wildcardToRegex(fileNamePattern)

      return filesToFilter.filter(file => regex.test(file.name))
    } catch (error) {
      // Invalid regex pattern
      return filesToFilter
    }
  }, [fileNamePattern, patternType])

  // Apply pattern filter whenever pattern or files change
  useEffect(() => {
    const filtered = filterFilesByPattern(allFiles)
    setFiles(filtered)
  }, [allFiles, fileNamePattern, patternType, filterFilesByPattern])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const csvFiles = Array.from(selectedFiles).filter(file => 
        file.name.endsWith('.csv') || file.name.endsWith('.CSV')
      )
      setAllFiles(csvFiles)
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
    setAllFiles(droppedFiles)
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
        description: "インポート可能なファイルがありません。まず検証を実行してください。",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
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
      setAllFiles([])
      setImportStatuses([])
      setParsedData([])
      setFileNamePattern("")
      
      // Call completion callback if provided
      if (onImportComplete) {
        onImportComplete()
      }
    } catch (error) {
      toast({
        title: "インポートエラー",
        description: error instanceof Error ? error.message : "インポート中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const isValid = plant && machineNo && files.length > 0

  if (mode === 'dialog') {
    return (
      <ScrollArea className="max-h-[70vh] pr-4">
        <div className="space-y-4 py-2">
          {/* Data Source Type, Plant and Machine No */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dialog-dataSource" className="text-sm">データソース</Label>
              <Select value={dataSourceType} onValueChange={(value) => setDataSourceType(value as CSVDataSourceType)}>
                <SelectTrigger id="dialog-dataSource" className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getDataSourceTypes().map((type) => {
                    const config = getDataSourceConfig(type)
                    return (
                      <SelectItem key={type} value={type}>
                        {config.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dialog-plant" className="text-sm">Plant</Label>
              <Input
                id="dialog-plant"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                placeholder="例: Plant A"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dialog-machineNo" className="text-sm">Machine No</Label>
              <Input
                id="dialog-machineNo"
                value={machineNo}
                onChange={(e) => setMachineNo(e.target.value)}
                placeholder="例: M-001"
                className="h-8"
              />
            </div>
          </div>

          {/* File Name Pattern Filter */}
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm">ファイル名フィルター</Label>
              <RadioGroup value={patternType} onValueChange={(value) => setPatternType(value as "wildcard" | "regex")} className="flex gap-3">
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="wildcard" id="dialog-wildcard" />
                  <Label htmlFor="dialog-wildcard" className="text-xs cursor-pointer">ワイルドカード</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="regex" id="dialog-regex" />
                  <Label htmlFor="dialog-regex" className="text-xs cursor-pointer">正規表現</Label>
                </div>
              </RadioGroup>
            </div>
            <Input
              value={fileNamePattern}
              onChange={(e) => setFileNamePattern(e.target.value)}
              placeholder={patternType === "wildcard" ? "例: *_2024*.csv, data_?.csv" : "例: ^data_\\d{4}\\.csv$"}
              className="h-8 text-sm"
            />
            <div className="text-xs text-muted-foreground">
              {patternType === "wildcard" ? (
                <>* は任意の文字列、? は任意の1文字にマッチします</>
              ) : (
                <>正規表現パターンを使用してファイル名をフィルタリングします</>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setPatternType("wildcard")
                  setFileNamePattern("*_2024*.csv")
                }}
              >
                2024年のファイル
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setPatternType("wildcard")
                  setFileNamePattern(`${dataSourceType}_*.csv`)
                }}
              >
                {dataSourceType}で始まる
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setPatternType("regex")
                  setFileNamePattern("\\d{8}")
                }}
              >
                日付を含む
              </Button>
            </div>
            {fileNamePattern && allFiles.length > 0 && (
              <div className="text-xs mt-1">
                <span className="text-muted-foreground">フィルタ結果: </span>
                <span className={files.length > 0 ? "text-green-600" : "text-red-600"}>
                  {files.length}個のファイルがマッチ
                </span>
                {files.length === 0 && allFiles.length > 0 && (
                  <span className="text-muted-foreground"> (全{allFiles.length}個中)</span>
                )}
              </div>
            )}
            {allFiles.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                ファイルを選択するとフィルタリング機能が有効になります
              </div>
            )}
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label className="text-sm">ファイル選択</Label>
            <div
              className={`
                border-2 border-dashed rounded-lg p-4 text-center transition-colors
                ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
                ${files.length > 0 ? 'bg-gray-50' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {files.length === 0 ? (
                <>
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    CSVファイルをドラッグ＆ドロップ
                  </p>
                  <div className="mt-2 flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      ファイルを選択
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
                    webkitdirectory=""
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </>
              ) : (
                <div className="space-y-2">
                  <FileText className="mx-auto h-10 w-10 text-primary" />
                  <p className="text-sm font-medium">
                    {allFiles.length}個のファイルから{files.length}個が選択されました
                  </p>
                  <ScrollArea className="h-20 w-full rounded border p-2">
                    <div className="space-y-1">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
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
                      setAllFiles([])
                      setFiles([])
                      setFileNamePattern("")
                    }}
                  >
                    クリア
                  </Button>
                </div>
              )}
            </div>
          </div>

          {files.length > 0 && (
            <div className="flex gap-2 justify-end">
              <Button
                onClick={handleValidate}
                disabled={!isValid}
                size="sm"
                variant="outline"
              >
                検証
              </Button>
              <Button
                onClick={handleImport}
                disabled={!isValid || importStatuses.filter(s => s.status === 'success').length === 0 || isImporting}
                size="sm"
              >
                {isImporting ? "インポート中..." : "インポート"}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    )
  }

  // Page mode
  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">CSV Import</h2>
          {importStatuses.length > 0 && importStatuses.filter(s => s.status === 'success').length > 0 && (
            <span className="text-sm text-green-600">
              {importStatuses.filter(s => s.status === 'success').length}個のファイルが検証済み
            </span>
          )}
        </div>
        <Button
          onClick={handleImport}
          disabled={!isValid || importStatuses.filter(s => s.status === 'success').length === 0 || isImporting}
          size="default"
          className="min-w-[120px]"
        >
          {isImporting ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              インポート中...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              インポート
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Left Column - Import Settings and File Selection */}
        <div className="overflow-y-auto">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">インポート設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data Source Type, Plant and Machine No */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dataSource" className="text-sm">データソース</Label>
                  <Select value={dataSourceType} onValueChange={(value) => setDataSourceType(value as CSVDataSourceType)}>
                    <SelectTrigger id="dataSource" className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getDataSourceTypes().map((type) => {
                        const config = getDataSourceConfig(type)
                        return (
                          <SelectItem key={type} value={type}>
                            {config.name}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="plant" className="text-sm">Plant</Label>
                  <Input
                    id="plant"
                    value={plant}
                    onChange={(e) => setPlant(e.target.value)}
                    placeholder="例: Plant A"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="machineNo" className="text-sm">Machine No</Label>
                  <Input
                    id="machineNo"
                    value={machineNo}
                    onChange={(e) => setMachineNo(e.target.value)}
                    placeholder="例: M-001"
                    className="h-8"
                  />
                </div>
              </div>

              {/* File Name Pattern Filter */}
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">ファイル名フィルター</Label>
                  <RadioGroup value={patternType} onValueChange={(value) => setPatternType(value as "wildcard" | "regex")} className="flex gap-3">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="wildcard" id="wildcard" />
                      <Label htmlFor="wildcard" className="text-xs">ワイルドカード</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="regex" id="regex" />
                      <Label htmlFor="regex" className="text-xs">正規表現</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Input
                  value={fileNamePattern}
                  onChange={(e) => setFileNamePattern(e.target.value)}
                  placeholder={patternType === "wildcard" ? "例: *_2024*.csv, data_?.csv" : "例: ^data_\\d{4}\\.csv$"}
                  className="h-8 text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  {patternType === "wildcard" ? (
                    <>* は任意の文字列、? は任意の1文字にマッチします</>
                  ) : (
                    <>正規表現パターンを使用してファイル名をフィルタリングします</>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setPatternType("wildcard")
                      setFileNamePattern("*_2024*.csv")
                    }}
                  >
                    2024年のファイル
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setPatternType("wildcard")
                      setFileNamePattern(`${dataSourceType}_*.csv`)
                    }}
                  >
                    {dataSourceType}で始まる
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setPatternType("regex")
                      setFileNamePattern("\\d{8}")
                    }}
                  >
                    日付を含む
                  </Button>
                </div>
                {fileNamePattern && allFiles.length > 0 && (
                  <div className="text-xs mt-1">
                    <span className="text-muted-foreground">フィルタ結果: </span>
                    <span className={files.length > 0 ? "text-green-600" : "text-red-600"}>
                      {files.length}個のファイルがマッチ
                    </span>
                    {files.length === 0 && allFiles.length > 0 && (
                      <span className="text-muted-foreground"> (全{allFiles.length}個中)</span>
                    )}
                  </div>
                )}
                {allFiles.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    ファイルを選択するとフィルタリング機能が有効になります
                  </div>
                )}
              </div>

              {/* File Selection */}
              <div className="space-y-2">
                <Label className="text-sm">ファイル選択</Label>
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-4 text-center transition-colors
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
                    ${files.length > 0 ? 'bg-gray-50' : ''}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {files.length === 0 ? (
                    <>
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        CSVファイルをドラッグ＆ドロップ
                      </p>
                      <div className="mt-2 flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          ファイルを選択
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
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
                        webkitdirectory=""
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </>
                  ) : (
                    <div className="space-y-2">
                      <FileText className="mx-auto h-10 w-10 text-primary" />
                      <p className="text-sm font-medium">
                        {allFiles.length}個のファイルから{files.length}個が選択されました
                      </p>
                      <ScrollArea className="h-20 w-full rounded border p-2">
                        <div className="space-y-1">
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
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
                          setAllFiles([])
                          setFiles([])
                          setImportStatuses([])
                          setParsedData([])
                          setFileNamePattern("")
                        }}
                      >
                        クリア
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {files.length > 0 && (
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={handleValidate}
                    disabled={!isValid}
                    size="sm"
                  >
                    検証
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview and Status */}
        <div className="space-y-3 overflow-y-auto">
          {importStatuses.length > 0 && (
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">検証結果</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {importStatuses.map((status, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted/50"
                        onClick={() => setActivePreviewIndex(index)}
                      >
                        <div className="flex items-center gap-2">
                          {status.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : status.status === 'error' ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{status.fileName}</p>
                            {status.message && (
                              <p className="text-xs text-muted-foreground">{status.message}</p>
                            )}
                          </div>
                        </div>
                        {status.rowCount !== undefined && (
                          <Badge variant="secondary" className="text-xs">{status.rowCount}行</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {parsedData.length > 0 && (
            <Card className="flex-1 min-h-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">データプレビュー</CardTitle>
                <CardDescription className="text-xs">
                  {parsedData[activePreviewIndex]?.metadata.fileName} - 最初の5行
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-[300px] w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {parsedData[activePreviewIndex]?.headers.map((header, index) => (
                          <TableHead key={index} className="whitespace-nowrap text-xs p-2">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData[activePreviewIndex]?.rows.slice(0, 5).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex} className="whitespace-nowrap text-xs p-2">
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