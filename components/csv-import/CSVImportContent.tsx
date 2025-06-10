"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"

// Extend HTMLInputElement to include webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
    webkitdirectory?: string
  }
}
import { FolderOpen, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CSVDataSourceType } from "@/types"
import { getDataSourceTypes, getDataSourceConfig } from "@/data/dataSourceTypes"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CSVImportContentProps {
  mode?: 'page' | 'dialog'
  onImportComplete?: () => void
}

// Convert wildcard pattern to regex
const wildcardToRegex = (pattern: string): RegExp => {
  const escapedPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except * and ?
    .replace(/\*/g, '.*') // * matches any characters
    .replace(/\?/g, '.') // ? matches single character
  return new RegExp(`^${escapedPattern}$`, 'i')
}

export const CSVImportContent = React.memo(function CSVImportContent({ mode = 'page', onImportComplete }: CSVImportContentProps) {
  const [dataSourceType, setDataSourceType] = useState<CSVDataSourceType>("SSAC")
  const [plant, setPlant] = useState("")
  const [machineNo, setMachineNo] = useState("")
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [allFilePaths, setAllFilePaths] = useState<string[]>([]) // All selected file paths before filtering
  const [fileNamePattern, setFileNamePattern] = useState("")
  const [patternType, setPatternType] = useState<"wildcard" | "regex">("wildcard")
  const [isImporting, setIsImporting] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Filter files based on pattern
  const filterFilesByPattern = useCallback((pathsToFilter: string[]): string[] => {
    if (!fileNamePattern) return pathsToFilter

    try {
      const regex = patternType === 'regex' 
        ? new RegExp(fileNamePattern, 'i')
        : wildcardToRegex(fileNamePattern)

      return pathsToFilter.filter(path => {
        const fileName = path.split('/').pop() || path.split('\\').pop() || ''
        return regex.test(fileName)
      })
    } catch (error) {
      // Invalid regex pattern
      return pathsToFilter
    }
  }, [fileNamePattern, patternType])

  // Apply pattern filter whenever pattern or files change
  useEffect(() => {
    const filtered = filterFilesByPattern(allFilePaths)
    setFilePaths(filtered)
  }, [allFilePaths, fileNamePattern, patternType, filterFilesByPattern])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const paths = Array.from(selectedFiles)
        .filter(file => file.name.endsWith('.csv') || file.name.endsWith('.CSV'))
        .map(file => file.name) // Note: Browser security prevents getting full paths
      setAllFilePaths(paths)
    }
  }, [])


  const handleImport = async () => {
    if (!plant || !machineNo || filePaths.length === 0) {
      toast({
        title: "入力エラー",
        description: "すべての必須項目を入力してください",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    try {
      // Prepare import conditions
      const importConditions = {
        dataSourceType,
        plant,
        machineNo,
        filePaths,
        fileNamePattern: fileNamePattern || undefined,
        patternType: fileNamePattern ? patternType : undefined,
        timestamp: new Date().toISOString()
      }

      // Log to console (temporary implementation)
      console.log('CSV Import Conditions:', importConditions)

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "インポート条件送信",
        description: `${filePaths.length}個のファイルの条件をAPIに送信しました（仮実装）`,
      })

      // Reset form
      setFilePaths([])
      setAllFilePaths([])
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

  const isValid = plant && machineNo && filePaths.length > 0

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
            {fileNamePattern && allFilePaths.length > 0 && (
              <div className="text-xs mt-1">
                <span className="text-muted-foreground">フィルタ結果: </span>
                <span className={filePaths.length > 0 ? "text-green-600" : "text-red-600"}>
                  {filePaths.length}個のファイルがマッチ
                </span>
                {filePaths.length === 0 && allFilePaths.length > 0 && (
                  <span className="text-muted-foreground"> (全{allFilePaths.length}個中)</span>
                )}
              </div>
            )}
            {allFilePaths.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                ファイルを選択するとフィルタリング機能が有効になります
              </div>
            )}
          </div>

          {/* File Selection Area */}
          <div className="space-y-2">
            <Label className="text-sm">ファイル選択</Label>
            <div
              className={`
                border-2 border-dashed rounded-lg p-4 text-center transition-colors
                border-gray-300
                ${filePaths.length > 0 ? 'bg-gray-50' : ''}
              `}
            >
              {filePaths.length === 0 ? (
                <>
                  <FolderOpen className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    CSVファイルを選択してください
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
                    {allFilePaths.length}個のファイルから{filePaths.length}個が選択されました
                  </p>
                  <ScrollArea className="h-20 w-full rounded border p-2">
                    <div className="space-y-1">
                      {filePaths.map((path, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="truncate">{path}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAllFilePaths([])
                      setFilePaths([])
                      setFileNamePattern("")
                    }}
                  >
                    クリア
                  </Button>
                </div>
              )}
            </div>
          </div>

          {filePaths.length > 0 && (
            <div className="flex gap-2 justify-end">
              <Button
                onClick={handleImport}
                disabled={!isValid || isImporting}
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
          {filePaths.length > 0 && (
            <span className="text-sm text-green-600">
              {filePaths.length}個のファイルが選択されています
            </span>
          )}
        </div>
        <Button
          onClick={handleImport}
          disabled={!isValid || isImporting}
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
                {fileNamePattern && allFilePaths.length > 0 && (
                  <div className="text-xs mt-1">
                    <span className="text-muted-foreground">フィルタ結果: </span>
                    <span className={filePaths.length > 0 ? "text-green-600" : "text-red-600"}>
                      {filePaths.length}個のファイルがマッチ
                    </span>
                    {filePaths.length === 0 && allFilePaths.length > 0 && (
                      <span className="text-muted-foreground"> (全{allFilePaths.length}個中)</span>
                    )}
                  </div>
                )}
                {allFilePaths.length === 0 && (
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
                    border-gray-300
                    ${filePaths.length > 0 ? 'bg-gray-50' : ''}
                  `}
                >
                  {filePaths.length === 0 ? (
                    <>
                      <FolderOpen className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        CSVファイルを選択してください
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
                        {allFilePaths.length}個のファイルから{filePaths.length}個が選択されました
                      </p>
                      <ScrollArea className="h-20 w-full rounded border p-2">
                        <div className="space-y-1">
                          {filePaths.map((path, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="truncate">{path}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAllFilePaths([])
                          setFilePaths([])
                          setFileNamePattern("")
                        }}
                      >
                        クリア
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Selected Files */}
        <div className="space-y-3 overflow-y-auto">
          {filePaths.length > 0 && (
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">選択されたファイル</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filePaths.map((path, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50"
                      >
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{path}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
})