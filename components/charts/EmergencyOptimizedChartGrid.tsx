"use client"

import React from "react"
import { FileNode } from "@/types"
import { VirtualizedChartGrid } from "./VirtualizedChartGrid"

interface EmergencyOptimizedChartGridProps {
  file: FileNode
}

/**
 * 緊急用の最適化されたチャートグリッド
 * FPSが極端に低い場合にこちらを使用
 */
export const EmergencyOptimizedChartGrid = React.memo(function EmergencyOptimizedChartGrid({ 
  file 
}: EmergencyOptimizedChartGridProps) {
  // 強制的に仮想化を使用
  return <VirtualizedChartGrid file={file} />
})

// 使用方法：ChartGrid.tsxで以下のように変更
// const VIRTUALIZATION_THRESHOLD = 1  // 常に仮想化