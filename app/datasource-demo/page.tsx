"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataSourceTab } from "@/components/charts/EditModal/data-source/DataSourceTab"
import { DataSourceTabRedesign } from "@/components/charts/EditModal/data-source/DataSourceTabRedesign"
import { DataSourceTabAlternative } from "@/components/charts/EditModal/data-source/DataSourceTabAlternative"
import { DataSourceTabKanban } from "@/components/charts/EditModal/data-source/DataSourceTabKanban"
import { Card } from "@/components/ui/card"
import { EventInfo } from "@/types"

export default function DataSourceDemoPage() {
  const [selectedDataSourceItems, setSelectedDataSourceItems] = useState<EventInfo[]>([])

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Source Tab UI Redesign</h1>
        <p className="text-muted-foreground">
          以下の3つの改善案を比較できます。それぞれ異なるアプローチでUIを改善しています。
        </p>
      </div>

      <Tabs defaultValue="redesign" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="current">現在のUI</TabsTrigger>
          <TabsTrigger value="redesign">案1: ステップ式</TabsTrigger>
          <TabsTrigger value="alternative">案2: ドラッグ&ドロップ</TabsTrigger>
          <TabsTrigger value="kanban">案3: カンバン式</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">現在のUI</h2>
            <div className="bg-background border rounded-lg p-4" style={{ height: "600px" }}>
              <DataSourceTab
                selectedDataSourceItems={selectedDataSourceItems}
                setSelectedDataSourceItems={setSelectedDataSourceItems}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="redesign" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">案1: ステップベースのワークフロー</h2>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">
                <strong>特徴:</strong> 明確な3ステップのワークフローで、ユーザーを段階的にガイド
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>ステップインジケーターで現在位置を表示</li>
                <li>各ステップで必要な操作のみを表示</li>
                <li>カード形式で情報を見やすく整理</li>
                <li>タブによるデータソースの分類</li>
              </ul>
            </div>
            <div className="bg-background border rounded-lg p-4" style={{ height: "600px" }}>
              <DataSourceTabRedesign
                selectedDataSourceItems={selectedDataSourceItems}
                setSelectedDataSourceItems={setSelectedDataSourceItems}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="alternative" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">案2: ドラッグ&ドロップ式</h2>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">
                <strong>特徴:</strong> 直感的なドラッグ&ドロップ操作で、素早くデータソースを管理
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>ミニマルなデザインで情報密度を向上</li>
                <li>ドラッグハンドルで直感的な操作</li>
                <li>視覚的な矢印でフローを表現</li>
                <li>色分けされたセクションで状態を区別</li>
              </ul>
            </div>
            <div className="bg-background border rounded-lg p-4" style={{ height: "600px" }}>
              <DataSourceTabAlternative
                selectedDataSourceItems={selectedDataSourceItems}
                setSelectedDataSourceItems={setSelectedDataSourceItems}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="kanban" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">案3: カンバンボード式</h2>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">
                <strong>特徴:</strong> カンバンボード形式で、データの流れを視覚的に管理
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>統計情報をダッシュボード風に表示</li>
                <li>プログレスバーで進捗を可視化</li>
                <li>カード形式で詳細情報を表示</li>
                <li>3列レイアウトでワークフローを表現</li>
              </ul>
            </div>
            <div className="bg-background border rounded-lg p-4" style={{ height: "700px" }}>
              <DataSourceTabKanban
                selectedDataSourceItems={selectedDataSourceItems}
                setSelectedDataSourceItems={setSelectedDataSourceItems}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8 p-6">
        <h3 className="text-lg font-semibold mb-4">改善ポイントのまとめ</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium mb-2 text-primary">案1: ステップ式</h4>
            <ul className="text-sm space-y-1">
              <li>✅ 初心者にも分かりやすい</li>
              <li>✅ 操作ミスが少ない</li>
              <li>✅ 進捗が明確</li>
              <li>❌ 操作に時間がかかる可能性</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-orange-600">案2: ドラッグ&ドロップ</h4>
            <ul className="text-sm space-y-1">
              <li>✅ 直感的で素早い操作</li>
              <li>✅ スペース効率が良い</li>
              <li>✅ 一覧性が高い</li>
              <li>❌ モバイルでの操作が難しい</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-green-600">案3: カンバン式</h4>
            <ul className="text-sm space-y-1">
              <li>✅ 視覚的で分かりやすい</li>
              <li>✅ 統計情報が豊富</li>
              <li>✅ プロジェクト管理に慣れた人に親しみやすい</li>
              <li>❌ 画面スペースを多く使用</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}