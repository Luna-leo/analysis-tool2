"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileNode } from "@/types"
import { Info } from "lucide-react"

interface BulkSettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileNode
}

export function BulkSettingsDrawer({ open, onOpenChange, file }: BulkSettingsDrawerProps) {
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[66.67%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>一括設定</SheetTitle>
          <SheetDescription>
            {file.name} のすべてのグラフに設定を一括適用します
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Tabs defaultValue="axis" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="axis" disabled>軸設定</TabsTrigger>
              <TabsTrigger value="style" disabled>スタイル</TabsTrigger>
            </TabsList>
            
            <TabsContent value="axis" className="mt-6 space-y-6">
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>軸設定の一括変更は今後実装予定です</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="style" className="mt-6 space-y-6">
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>スタイル設定の一括変更は今後実装予定です</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Apply Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              閉じる
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}