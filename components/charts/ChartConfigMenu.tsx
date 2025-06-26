import React, { useRef, useState } from 'react'
import { Download, Upload, Save, FolderOpen, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useChartConfigExport } from '@/hooks/useChartConfigExport'
import { ExportConfigDialog } from './ExportConfigDialog'
import type { ChartComponent, LayoutSettings, ChartSettings, EventInfo } from '@/types'
import type { ChartGridConfig } from '@/types/chart-config'

interface ChartConfigMenuProps {
  fileId: string
  fileName: string
  layoutSettings: LayoutSettings
  chartSettings: ChartSettings
  charts: ChartComponent[]
  selectedDataSources?: EventInfo[]
  onImport: (config: ChartGridConfig, mode?: 'overwrite' | 'new-page') => void
  onCreateNewPage?: (fileName: string, config: ChartGridConfig) => void
}

export function ChartConfigMenu({
  fileId,
  fileName,
  layoutSettings,
  chartSettings,
  charts,
  selectedDataSources,
  onImport,
  onCreateNewPage
}: ChartConfigMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [savePresetOpen, setSavePresetOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importMode, setImportMode] = useState<'overwrite' | 'new-page'>('overwrite')
  const [newPageName, setNewPageName] = useState('')
  const [pendingImportConfig, setPendingImportConfig] = useState<ChartGridConfig | null>(null)
  const [presets, setPresets] = useState<Record<string, ChartGridConfig>>({})
  
  const {
    exportConfig,
    importConfig,
    saveAsPreset,
    loadPreset,
    getPresets,
    deletePreset,
    isExporting,
    isImporting
  } = useChartConfigExport()

  // Initialize presets on mount and update when needed
  React.useEffect(() => {
    setPresets(getPresets())
  }, [getPresets])

  const presetNames = Object.keys(presets)

  const handleExport = (customFilename?: string) => {
    exportConfig(fileId, fileName, layoutSettings, chartSettings, charts, selectedDataSources, customFilename)
    setExportDialogOpen(false)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const config = await importConfig(file)
    if (config) {
      setPendingImportConfig(config)
      setNewPageName(config.metadata.fileName || 'Imported Chart')
      setImportDialogOpen(true)
    }

    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) return

    saveAsPreset(presetName, {
      version: '1.0.0',
      layoutSettings,
      chartSettings,
      charts,
      selectedDataSources
    })
    setSavePresetOpen(false)
    setPresetName('')
    // Update presets state after saving
    setPresets(getPresets())
  }

  const handleLoadPreset = (name: string) => {
    const preset = loadPreset(name)
    if (preset) {
      setPendingImportConfig(preset)
      setNewPageName(preset.metadata.fileName || name)
      setImportDialogOpen(true)
    }
  }

  const handleImportConfirm = () => {
    if (!pendingImportConfig) return

    if (importMode === 'overwrite') {
      onImport(pendingImportConfig, 'overwrite')
    } else if (importMode === 'new-page' && onCreateNewPage) {
      onCreateNewPage(newPageName, pendingImportConfig)
    }

    setImportDialogOpen(false)
    setPendingImportConfig(null)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-3 flex items-center justify-center gap-1.5 text-xs">
            <MoreVertical className="h-3.5 w-3.5" />
            <span>Config</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setExportDialogOpen(true)} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Export Configuration
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick} disabled={isImporting}>
            <Upload className="h-4 w-4 mr-2" />
            Import Configuration
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSavePresetOpen(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save as Preset
          </DropdownMenuItem>
          {presetNames.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Preset
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                {presetNames.map((name) => (
                  <DropdownMenuItem
                    key={name}
                    className="justify-between"
                    onSelect={() => handleLoadPreset(name)}
                  >
                    <span>{name}</span>
                    <button
                      className="h-6 w-6 p-0 hover:bg-muted rounded flex items-center justify-center"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        deletePreset(name)
                        // Update presets state after deletion
                        setPresets(getPresets())
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Save Preset Dialog */}
      <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Configuration as Preset</DialogTitle>
            <DialogDescription>
              Save the current chart configuration as a preset for quick access
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter preset name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSavePreset()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavePresetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Mode Selection Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Configuration</DialogTitle>
            <DialogDescription>
              Choose how to import the configuration file
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={importMode} onValueChange={(value: 'overwrite' | 'new-page') => setImportMode(value)}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="overwrite" id="overwrite" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="overwrite" className="font-medium cursor-pointer">
                    Apply to current page
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Replace the current page's configuration with the imported settings
                  </p>
                </div>
              </div>
              {onCreateNewPage && (
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="new-page" id="new-page" className="mt-1" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="new-page" className="font-medium cursor-pointer">
                      Create new page
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Create a new file with the imported configuration
                    </p>
                  </div>
                </div>
              )}
            </RadioGroup>
            
            {importMode === 'new-page' && (
              <div className="grid gap-2">
                <Label htmlFor="new-page-name">Page Name</Label>
                <Input
                  id="new-page-name"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="Enter page name"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportConfirm} 
              disabled={importMode === 'new-page' && !newPageName.trim()}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Configuration Dialog */}
      <ExportConfigDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        defaultFilename={fileName}
        isExporting={isExporting}
      />
    </>
  )
}