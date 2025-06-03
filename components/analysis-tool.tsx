"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import {
  FolderOpen,
  Search,
  Database,
  Settings,
  File,
  Folder,
  X,
  ChevronRight,
  ChevronDown,
  BarChart3,
  LineChart,
  PieChart,
  LayoutGrid,
  Edit,
  Trash2,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ActiveView = "explorer" | "search" | "database" | "settings"

interface ChartComponent {
  id: string
  title: string
  chartType: "bar" | "line" | "pie"
  data: Array<{ name: string; value: number }>
  // 新しいプロパティを追加
  legend?: boolean
  xLabel?: string
  yLabel?: string
  xParameter?: string
  yParameters?: string[]
  verticalLines?: Array<{ value: number; label?: string; color?: string }>
  horizontalLines?: Array<{ value: number; label?: string; color?: string }>
  dataSource?: {
    name: string
    table: string
    columns: string[]
    lastUpdated: string
  }
  // 新しく追加するプロパティ
  xAxisType?: "datetime" | "time" | "numeric" | "category" | "parameter"
  xAxisRange?: {
    auto?: boolean
    min: string | number
    max: string | number
    unit?: "sec" | "min" | "hr"
  }
  yAxisParams?: Array<{
    parameter: string
    axisName: string
    range?: {
      auto?: boolean
      min: number
      max: number
    }
    marker?: {
      type: "circle" | "square" | "triangle" | "diamond"
      size: number
      borderColor: string
      fillColor: string
    }
    line?: {
      width: number
      color: string
      style: "solid" | "dashed" | "dotted"
    }
  }>
}

interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  chartType?: "bar" | "line" | "pie"
  dataSources?: string[]
  charts?: ChartComponent[]
}

// ファイルのパスを取得する関数
const getFilePath = (fileId: string, nodes: FileNode[], path: string[] = []): string[] | null => {
  for (const node of nodes) {
    const currentPath = [...path, node.name]

    if (node.id === fileId) {
      return currentPath
    }

    if (node.children) {
      const result = getFilePath(fileId, node.children, currentPath)
      if (result) {
        return result
      }
    }
  }
  return null
}

const mockFileTree: FileNode[] = [
  {
    id: "1",
    name: "Sales Analysis",
    type: "folder",
    children: [
      {
        id: "2",
        name: "Q1 Revenue Dashboard",
        type: "file",
        dataSources: ["Sales DB", "Revenue API", "Customer Data"],
        charts: [
          // Revenue Charts (1-10)
          {
            id: "chart-1",
            title: "Monthly Revenue",
            chartType: "bar",
            data: [
              { name: "Jan", value: 400 },
              { name: "Feb", value: 300 },
              { name: "Mar", value: 600 },
            ],
            dataSource: {
              name: "Revenue Database",
              table: "monthly_revenue",
              columns: ["month", "revenue", "region", "product_category"],
              lastUpdated: "2024-01-15 14:30:00",
            },
          },
          {
            id: "chart-2",
            title: "Revenue Trend",
            chartType: "line",
            data: [
              { name: "Week 1", value: 100 },
              { name: "Week 2", value: 200 },
              { name: "Week 3", value: 150 },
              { name: "Week 4", value: 300 },
            ],
          },
          {
            id: "chart-3",
            title: "Revenue by Region",
            chartType: "pie",
            data: [
              { name: "North", value: 35 },
              { name: "South", value: 25 },
              { name: "East", value: 20 },
              { name: "West", value: 20 },
            ],
          },
          {
            id: "chart-4",
            title: "Customer Segments",
            chartType: "pie",
            data: [
              { name: "Enterprise", value: 45 },
              { name: "SMB", value: 30 },
              { name: "Startup", value: 25 },
            ],
          },
          {
            id: "chart-5",
            title: "Quarterly Revenue",
            chartType: "bar",
            data: [
              { name: "Q1", value: 1200 },
              { name: "Q2", value: 1400 },
              { name: "Q3", value: 1100 },
              { name: "Q4", value: 1600 },
            ],
          },
          {
            id: "chart-6",
            title: "Revenue Growth Rate",
            chartType: "line",
            data: [
              { name: "Jan", value: 5.2 },
              { name: "Feb", value: 6.1 },
              { name: "Mar", value: 4.8 },
              { name: "Apr", value: 7.3 },
            ],
          },
          {
            id: "chart-7",
            title: "Product Revenue Mix",
            chartType: "pie",
            data: [
              { name: "Product A", value: 40 },
              { name: "Product B", value: 30 },
              { name: "Product C", value: 20 },
              { name: "Product D", value: 10 },
            ],
          },
          {
            id: "chart-8",
            title: "Daily Revenue",
            chartType: "line",
            data: [
              { name: "Mon", value: 120 },
              { name: "Tue", value: 140 },
              { name: "Wed", value: 110 },
              { name: "Thu", value: 160 },
              { name: "Fri", value: 180 },
            ],
          },
          {
            id: "chart-9",
            title: "Revenue by Channel",
            chartType: "bar",
            data: [
              { name: "Online", value: 600 },
              { name: "Retail", value: 400 },
              { name: "Partner", value: 300 },
              { name: "Direct", value: 200 },
            ],
          },
          {
            id: "chart-10",
            title: "Revenue Forecast",
            chartType: "line",
            data: [
              { name: "Current", value: 1000 },
              { name: "Next Month", value: 1200 },
              { name: "2 Months", value: 1400 },
              { name: "3 Months", value: 1600 },
            ],
          },
          // Sales Charts (11-20)
          {
            id: "chart-11",
            title: "Sales Volume",
            chartType: "bar",
            data: [
              { name: "Jan", value: 800 },
              { name: "Feb", value: 900 },
              { name: "Mar", value: 750 },
              { name: "Apr", value: 1100 },
            ],
          },
          {
            id: "chart-12",
            title: "Sales Conversion Rate",
            chartType: "line",
            data: [
              { name: "Week 1", value: 12.5 },
              { name: "Week 2", value: 14.2 },
              { name: "Week 3", value: 11.8 },
              { name: "Week 4", value: 15.6 },
            ],
          },
          {
            id: "chart-13",
            title: "Sales by Team",
            chartType: "pie",
            data: [
              { name: "Team A", value: 35 },
              { name: "Team B", value: 28 },
              { name: "Team C", value: 22 },
              { name: "Team D", value: 15 },
            ],
          },
          {
            id: "chart-14",
            title: "Lead Generation",
            chartType: "bar",
            data: [
              { name: "Organic", value: 450 },
              { name: "Paid", value: 320 },
              { name: "Referral", value: 180 },
              { name: "Social", value: 120 },
            ],
          },
          {
            id: "chart-15",
            title: "Sales Pipeline",
            chartType: "line",
            data: [
              { name: "Prospects", value: 1000 },
              { name: "Qualified", value: 600 },
              { name: "Proposal", value: 300 },
              { name: "Closed", value: 150 },
            ],
          },
          {
            id: "chart-16",
            title: "Deal Size Distribution",
            chartType: "pie",
            data: [
              { name: "Small", value: 40 },
              { name: "Medium", value: 35 },
              { name: "Large", value: 20 },
              { name: "Enterprise", value: 5 },
            ],
          },
          {
            id: "chart-17",
            title: "Sales Cycle Length",
            chartType: "bar",
            data: [
              { name: "0-30 days", value: 25 },
              { name: "31-60 days", value: 35 },
              { name: "61-90 days", value: 25 },
              { name: "90+ days", value: 15 },
            ],
          },
          {
            id: "chart-18",
            title: "Win Rate by Source",
            chartType: "line",
            data: [
              { name: "Inbound", value: 25 },
              { name: "Outbound", value: 15 },
              { name: "Referral", value: 35 },
              { name: "Partner", value: 20 },
            ],
          },
          {
            id: "chart-19",
            title: "Sales Activity",
            chartType: "bar",
            data: [
              { name: "Calls", value: 120 },
              { name: "Emails", value: 200 },
              { name: "Meetings", value: 45 },
              { name: "Demos", value: 30 },
            ],
          },
          {
            id: "chart-20",
            title: "Customer Acquisition Cost",
            chartType: "line",
            data: [
              { name: "Q1", value: 150 },
              { name: "Q2", value: 140 },
              { name: "Q3", value: 160 },
              { name: "Q4", value: 135 },
            ],
          },
          // Customer Charts (21-30)
          {
            id: "chart-21",
            title: "Customer Satisfaction",
            chartType: "pie",
            data: [
              { name: "Very Satisfied", value: 45 },
              { name: "Satisfied", value: 35 },
              { name: "Neutral", value: 15 },
              { name: "Dissatisfied", value: 5 },
            ],
          },
          {
            id: "chart-22",
            title: "Customer Retention Rate",
            chartType: "line",
            data: [
              { name: "Month 1", value: 95 },
              { name: "Month 3", value: 88 },
              { name: "Month 6", value: 82 },
              { name: "Month 12", value: 75 },
            ],
          },
          {
            id: "chart-23",
            title: "Customer Lifetime Value",
            chartType: "bar",
            data: [
              { name: "Segment A", value: 2500 },
              { name: "Segment B", value: 1800 },
              { name: "Segment C", value: 1200 },
              { name: "Segment D", value: 800 },
            ],
          },
          {
            id: "chart-24",
            title: "Churn Rate by Cohort",
            chartType: "line",
            data: [
              { name: "Jan Cohort", value: 8 },
              { name: "Feb Cohort", value: 6 },
              { name: "Mar Cohort", value: 7 },
              { name: "Apr Cohort", value: 5 },
            ],
          },
          {
            id: "chart-25",
            title: "Support Ticket Volume",
            chartType: "bar",
            data: [
              { name: "Critical", value: 15 },
              { name: "High", value: 45 },
              { name: "Medium", value: 120 },
              { name: "Low", value: 200 },
            ],
          },
          {
            id: "chart-26",
            title: "Customer Engagement Score",
            chartType: "pie",
            data: [
              { name: "High", value: 30 },
              { name: "Medium", value: 45 },
              { name: "Low", value: 20 },
              { name: "Inactive", value: 5 },
            ],
          },
          {
            id: "chart-27",
            title: "Feature Usage",
            chartType: "bar",
            data: [
              { name: "Feature A", value: 85 },
              { name: "Feature B", value: 70 },
              { name: "Feature C", value: 55 },
              { name: "Feature D", value: 40 },
            ],
          },
          {
            id: "chart-28",
            title: "Customer Journey Stage",
            chartType: "pie",
            data: [
              { name: "Awareness", value: 40 },
              { name: "Consideration", value: 30 },
              { name: "Purchase", value: 20 },
              { name: "Retention", value: 10 },
            ],
          },
          {
            id: "chart-29",
            title: "NPS Score Trend",
            chartType: "line",
            data: [
              { name: "Q1", value: 65 },
              { name: "Q2", value: 68 },
              { name: "Q3", value: 72 },
              { name: "Q4", value: 75 },
            ],
          },
          {
            id: "chart-30",
            title: "Customer Feedback Categories",
            chartType: "bar",
            data: [
              { name: "Product", value: 120 },
              { name: "Service", value: 85 },
              { name: "Pricing", value: 45 },
              { name: "Support", value: 60 },
            ],
          },
          // Marketing Charts (31-40)
          {
            id: "chart-31",
            title: "Campaign ROI",
            chartType: "bar",
            data: [
              { name: "Email", value: 320 },
              { name: "Social", value: 280 },
              { name: "PPC", value: 450 },
              { name: "Content", value: 180 },
            ],
          },
          {
            id: "chart-32",
            title: "Website Traffic",
            chartType: "line",
            data: [
              { name: "Week 1", value: 12000 },
              { name: "Week 2", value: 14500 },
              { name: "Week 3", value: 13200 },
              { name: "Week 4", value: 16800 },
            ],
          },
          {
            id: "chart-33",
            title: "Traffic Sources",
            chartType: "pie",
            data: [
              { name: "Organic", value: 45 },
              { name: "Direct", value: 25 },
              { name: "Social", value: 15 },
              { name: "Paid", value: 15 },
            ],
          },
          {
            id: "chart-34",
            title: "Email Open Rates",
            chartType: "line",
            data: [
              { name: "Campaign 1", value: 22.5 },
              { name: "Campaign 2", value: 25.8 },
              { name: "Campaign 3", value: 19.2 },
              { name: "Campaign 4", value: 28.1 },
            ],
          },
          {
            id: "chart-35",
            title: "Social Media Engagement",
            chartType: "bar",
            data: [
              { name: "Facebook", value: 1200 },
              { name: "Twitter", value: 800 },
              { name: "LinkedIn", value: 600 },
              { name: "Instagram", value: 1500 },
            ],
          },
          {
            id: "chart-36",
            title: "Content Performance",
            chartType: "pie",
            data: [
              { name: "Blog Posts", value: 40 },
              { name: "Videos", value: 30 },
              { name: "Infographics", value: 20 },
              { name: "Podcasts", value: 10 },
            ],
          },
          {
            id: "chart-37",
            title: "Lead Quality Score",
            chartType: "bar",
            data: [
              { name: "Hot", value: 25 },
              { name: "Warm", value: 45 },
              { name: "Cold", value: 30 },
            ],
          },
          {
            id: "chart-38",
            title: "Marketing Qualified Leads",
            chartType: "line",
            data: [
              { name: "Jan", value: 150 },
              { name: "Feb", value: 180 },
              { name: "Mar", value: 165 },
              { name: "Apr", value: 220 },
            ],
          },
          {
            id: "chart-39",
            title: "Ad Spend Efficiency",
            chartType: "bar",
            data: [
              { name: "Google Ads", value: 4.2 },
              { name: "Facebook Ads", value: 3.8 },
              { name: "LinkedIn Ads", value: 5.1 },
              { name: "Twitter Ads", value: 2.9 },
            ],
          },
          {
            id: "chart-40",
            title: "Brand Awareness",
            chartType: "line",
            data: [
              { name: "Q1", value: 35 },
              { name: "Q2", value: 42 },
              { name: "Q3", value: 48 },
              { name: "Q4", value: 55 },
            ],
          },
          // Operations Charts (41-50)
          {
            id: "chart-41",
            title: "Operational Efficiency",
            chartType: "pie",
            data: [
              { name: "Excellent", value: 25 },
              { name: "Good", value: 45 },
              { name: "Average", value: 25 },
              { name: "Poor", value: 5 },
            ],
          },
          {
            id: "chart-42",
            title: "Resource Utilization",
            chartType: "bar",
            data: [
              { name: "Team A", value: 85 },
              { name: "Team B", value: 92 },
              { name: "Team C", value: 78 },
              { name: "Team D", value: 88 },
            ],
          },
          {
            id: "chart-43",
            title: "Project Timeline",
            chartType: "line",
            data: [
              { name: "Planning", value: 100 },
              { name: "Development", value: 75 },
              { name: "Testing", value: 50 },
              { name: "Deployment", value: 25 },
            ],
          },
          {
            id: "chart-44",
            title: "Quality Metrics",
            chartType: "bar",
            data: [
              { name: "Defect Rate", value: 2.1 },
              { name: "Bug Reports", value: 15 },
              { name: "User Issues", value: 8 },
              { name: "System Errors", value: 3 },
            ],
          },
          {
            id: "chart-45",
            title: "Performance Indicators",
            chartType: "line",
            data: [
              { name: "Response Time", value: 250 },
              { name: "Throughput", value: 1200 },
              { name: "Availability", value: 99.9 },
              { name: "Error Rate", value: 0.1 },
            ],
          },
          {
            id: "chart-46",
            title: "Cost Breakdown",
            chartType: "pie",
            data: [
              { name: "Personnel", value: 60 },
              { name: "Infrastructure", value: 25 },
              { name: "Tools", value: 10 },
              { name: "Other", value: 5 },
            ],
          },
          {
            id: "chart-47",
            title: "Productivity Trends",
            chartType: "line",
            data: [
              { name: "Week 1", value: 85 },
              { name: "Week 2", value: 88 },
              { name: "Week 3", value: 92 },
              { name: "Week 4", value: 90 },
            ],
          },
          {
            id: "chart-48",
            title: "Capacity Planning",
            chartType: "bar",
            data: [
              { name: "Current", value: 75 },
              { name: "Projected", value: 85 },
              { name: "Maximum", value: 100 },
            ],
          },
          {
            id: "chart-49",
            title: "Risk Assessment",
            chartType: "pie",
            data: [
              { name: "Low Risk", value: 60 },
              { name: "Medium Risk", value: 30 },
              { name: "High Risk", value: 8 },
              { name: "Critical Risk", value: 2 },
            ],
          },
          {
            id: "chart-50",
            title: "Compliance Status",
            chartType: "bar",
            data: [
              { name: "Compliant", value: 92 },
              { name: "Partial", value: 6 },
              { name: "Non-Compliant", value: 2 },
            ],
          },
        ],
      },
      {
        id: "3",
        name: "Monthly Trends",
        type: "file",
        dataSources: ["Analytics DB", "Time Series API"],
        charts: [
          {
            id: "chart-5",
            title: "Sales Trend",
            chartType: "line",
            data: [
              { name: "Jan", value: 100 },
              { name: "Feb", value: 200 },
              { name: "Mar", value: 150 },
              { name: "Apr", value: 300 },
              { name: "May", value: 250 },
            ],
          },
          {
            id: "chart-6",
            title: "Growth Rate",
            chartType: "bar",
            data: [
              { name: "Q1", value: 15 },
              { name: "Q2", value: 25 },
              { name: "Q3", value: 20 },
              { name: "Q4", value: 30 },
            ],
          },
        ],
      },
      {
        id: "4",
        name: "Product Analysis",
        type: "file",
        dataSources: ["Product DB", "Inventory API", "Sales Data"],
        charts: [
          {
            id: "chart-7",
            title: "Product Mix",
            chartType: "pie",
            data: [
              { name: "Product A", value: 35 },
              { name: "Product B", value: 25 },
              { name: "Product C", value: 20 },
              { name: "Product D", value: 20 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "5",
    name: "Marketing Data",
    type: "folder",
    children: [
      {
        id: "6",
        name: "Campaign Dashboard",
        type: "file",
        dataSources: ["Marketing DB", "Campaign API"],
        charts: [
          {
            id: "chart-8",
            title: "Campaign Performance",
            chartType: "bar",
            data: [
              { name: "Email", value: 400 },
              { name: "Social", value: 300 },
              { name: "Search", value: 600 },
              { name: "Display", value: 200 },
            ],
          },
          {
            id: "chart-9",
            title: "Conversion Rate",
            chartType: "line",
            data: [
              { name: "Week 1", value: 5.2 },
              { name: "Week 2", value: 6.1 },
              { name: "Week 3", value: 4.8 },
              { name: "Week 4", value: 7.3 },
            ],
          },
          {
            id: "chart-10",
            title: "Channel Distribution",
            chartType: "pie",
            data: [
              { name: "Organic", value: 40 },
              { name: "Paid", value: 35 },
              { name: "Social", value: 15 },
              { name: "Direct", value: 10 },
            ],
          },
        ],
      },
      {
        id: "7",
        name: "User Engagement",
        type: "file",
        dataSources: ["User Analytics", "Engagement API", "Behavior DB"],
        charts: [
          {
            id: "chart-11",
            title: "Daily Active Users",
            chartType: "line",
            data: [
              { name: "Mon", value: 1200 },
              { name: "Tue", value: 1400 },
              { name: "Wed", value: 1100 },
              { name: "Thu", value: 1600 },
              { name: "Fri", value: 1800 },
            ],
          },
          {
            id: "chart-12",
            title: "Session Duration",
            chartType: "bar",
            data: [
              { name: "0-5min", value: 30 },
              { name: "5-15min", value: 45 },
              { name: "15-30min", value: 20 },
              { name: "30min+", value: 5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "8",
    name: "Financial Reports",
    type: "folder",
    children: [
      {
        id: "9",
        name: "Budget Analysis",
        type: "file",
        dataSources: ["Finance DB", "Budget API"],
        charts: [
          {
            id: "chart-13",
            title: "Budget vs Actual",
            chartType: "bar",
            data: [
              { name: "Q1", value: 85 },
              { name: "Q2", value: 92 },
              { name: "Q3", value: 78 },
              { name: "Q4", value: 95 },
            ],
          },
        ],
      },
      {
        id: "10",
        name: "Cost Analysis",
        type: "file",
        dataSources: ["Cost Center DB", "Expense API", "Accounting Data"],
        charts: [
          {
            id: "chart-14",
            title: "Cost Breakdown",
            chartType: "pie",
            data: [
              { name: "Personnel", value: 45 },
              { name: "Operations", value: 25 },
              { name: "Marketing", value: 20 },
              { name: "Other", value: 10 },
            ],
          },
          {
            id: "chart-15",
            title: "Monthly Expenses",
            chartType: "line",
            data: [
              { name: "Jan", value: 50000 },
              { name: "Feb", value: 55000 },
              { name: "Mar", value: 48000 },
              { name: "Apr", value: 62000 },
              { name: "May", value: 58000 },
            ],
          },
        ],
      },
    ],
  },
]

export default function Component() {
  const [activeView, setActiveView] = useState<ActiveView>("explorer")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1"]))
  const [openTabs, setOpenTabs] = useState<FileNode[]>([])
  const [activeTab, setActiveTab] = useState<string>("")
  const [layoutSettingsMap, setLayoutSettingsMap] = useState<
    Record<
      string,
      {
        columns: number
        rows: number
        pagination: boolean
        showFileName: boolean
        showDataSources: boolean
      }
    >
  >({})

  const [draggedTab, setDraggedTab] = useState<string | null>(null)
  const [dragOverTab, setDragOverTab] = useState<string | null>(null)

  // グラフ設定用のstate
  const [chartSettingsMap, setChartSettingsMap] = useState<
    Record<
      string,
      {
        showDataLabels: boolean
        showGridLines: boolean
        showLegend: boolean
        enableAnimation: boolean
        theme: "default" | "dark" | "colorful"
      }
    >
  >({})

  const [editingChart, setEditingChart] = useState<ChartComponent | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [hoveredChart, setHoveredChart] = useState<string | null>(null)

  // デフォルトのレイアウト設定を定義
  const defaultLayoutSettings = {
    columns: 2,
    rows: 2,
    pagination: true,
    showFileName: true,
    showDataSources: true,
  }

  // デフォルトのチャート設定を定義
  const defaultChartSettings = {
    showDataLabels: true,
    showGridLines: true,
    showLegend: true,
    enableAnimation: true,
    theme: "default" as const,
  }

  const [currentPage, setCurrentPage] = useState(1)
  const [chartSizes, setChartSizes] = useState<{
    cardMinHeight: number
    chartMinHeight: number
    isCompactLayout: boolean
  }>({
    cardMinHeight: 180,
    chartMinHeight: 80,
    isCompactLayout: false,
  })
  const contentRef = useRef<HTMLDivElement>(null)

  const getCurrentLayoutSettings = () => {
    return activeTab && layoutSettingsMap[activeTab] ? layoutSettingsMap[activeTab] : defaultLayoutSettings
  }

  const updateLayoutSettings = (settings: typeof defaultLayoutSettings) => {
    if (activeTab) {
      setLayoutSettingsMap((prev) => ({
        ...prev,
        [activeTab]: settings,
      }))
    }
  }

  const getCurrentChartSettings = () => {
    return activeTab && chartSettingsMap[activeTab] ? chartSettingsMap[activeTab] : defaultChartSettings
  }

  const updateChartSettings = (settings: typeof defaultChartSettings) => {
    if (activeTab) {
      setChartSettingsMap((prev) => ({
        ...prev,
        [activeTab]: settings,
      }))
    }
  }

  // チャートのサイズを計算（ページネーションON/OFF関係なく統一）
  useEffect(() => {
    if (contentRef.current) {
      const updateChartSizes = () => {
        const currentSettings = getCurrentLayoutSettings()

        // グリッドサイズに基づいてコンパクトレイアウトかどうかを判断
        const isCompactLayout = currentSettings.rows >= 3 || currentSettings.columns >= 3

        // コンテナの高さを取得
        const containerHeight = contentRef.current?.clientHeight || 600

        // より正確なヘッダー高さの計算
        let headerHeight = 24 // 基本パディング（p-6の上部分）
        if (currentSettings.showFileName) headerHeight += 44 // ファイル名（text-2xl + mb-2）
        if (currentSettings.showDataSources) headerHeight += 36 // データソース + gap
        headerHeight += 24 // mb-6

        // ページネーション部分の高さ（より正確に）
        const paginationHeight = currentSettings.pagination ? 89 : 0 // border-t + py-4 + 内容

        // グリッド間のギャップ（gap-6 = 24px または gap-3 = 12px）
        const gapSize = isCompactLayout ? 12 : 24
        const gapHeight = (currentSettings.rows - 1) * gapSize

        // チャート内部の要素高さ（グリッドサイズに応じて調整）
        const chartPadding = isCompactLayout ? 12 : 16 // p-3 or p-4
        const chartTitleHeight = isCompactLayout ? 40 : 56 // より小さなタイトル

        // 利用可能な高さを計算（より保守的に）
        const availableHeight = containerHeight - headerHeight - paginationHeight - 24 // 24pxの余裕

        // 各チャート行の高さを計算
        const chartRowHeight = (availableHeight - gapHeight) / currentSettings.rows

        // カードとチャートの最小高さを設定
        const cardMinHeight = isCompactLayout ? 140 : 180
        const chartMinHeight = isCompactLayout ? 60 : 80

        setChartSizes({
          cardMinHeight,
          chartMinHeight,
          isCompactLayout,
        })
      }

      // ResizeObserverを使用してより正確なサイズ監視
      const resizeObserver = new ResizeObserver(() => {
        // 少し遅延させて正確なサイズを取得
        setTimeout(updateChartSizes, 100)
      })

      resizeObserver.observe(contentRef.current)

      // 初回計算
      setTimeout(updateChartSizes, 100)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [layoutSettingsMap, activeTab])

  const handleViewClick = (view: ActiveView) => {
    if (activeView === view) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setActiveView(view)
      setSidebarOpen(true)
    }
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const openFile = (file: FileNode) => {
    if (!openTabs.find((tab) => tab.id === file.id)) {
      setOpenTabs([...openTabs, file])
      // ファイルのレイアウト設定がまだ存在しない場合は初期化
      if (!layoutSettingsMap[file.id]) {
        setLayoutSettingsMap((prev) => ({
          ...prev,
          [file.id]: { ...defaultLayoutSettings },
        }))
      }
      // ファイルのチャート設定がまだ存在しない場合は初期化
      if (!chartSettingsMap[file.id]) {
        setChartSettingsMap((prev) => ({
          ...prev,
          [file.id]: { ...defaultChartSettings },
        }))
      }
    }
    setActiveTab(file.id)
    setCurrentPage(1) // 新しいファイルを開いたときはページを1にリセット
  }

  const closeTab = (fileId: string) => {
    const newTabs = openTabs.filter((tab) => tab.id !== fileId)
    setOpenTabs(newTabs)
    if (activeTab === fileId && newTabs.length > 0) {
      setActiveTab(newTabs[newTabs.length - 1].id)
    } else if (newTabs.length === 0) {
      setActiveTab("")
    }
  }

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverTab(tabId)
  }

  const handleDragLeave = () => {
    setDragOverTab(null)
  }

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault()

    if (!draggedTab || draggedTab === targetTabId) {
      setDraggedTab(null)
      setDragOverTab(null)
      return
    }

    const draggedIndex = openTabs.findIndex((tab) => tab.id === draggedTab)
    const targetIndex = openTabs.findIndex((tab) => tab.id === targetTabId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTab(null)
      setDragOverTab(null)
      return
    }

    const newTabs = [...openTabs]
    const [draggedTabData] = newTabs.splice(draggedIndex, 1)
    newTabs.splice(targetIndex, 0, draggedTabData)

    setOpenTabs(newTabs)
    setDraggedTab(null)
    setDragOverTab(null)
  }

  const handleDragEnd = () => {
    setDraggedTab(null)
    setDragOverTab(null)
  }

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <div
          className={cn("flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer text-sm", `ml-${depth * 4}`)}
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder(node.id)
            } else {
              openFile(node)
            }
          }}
        >
          {node.type === "folder" ? (
            <>
              {expandedFolders.has(node.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="h-4 w-4" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File className="h-4 w-4" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === "folder" && expandedFolders.has(node.id) && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ))
  }

  const renderChart = (file: FileNode) => {
    const currentSettings = getCurrentLayoutSettings()
    const { isCompactLayout, cardMinHeight, chartMinHeight } = chartSizes

    if (!file.charts || file.charts.length === 0) {
      return (
        <div className="p-6">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>No charts available for this file</p>
            </div>
          </div>
        </div>
      )
    }

    const charts = file.charts

    // ページネーション処理
    const totalItems = charts.length
    let totalPages = 1
    let currentCharts = charts

    if (currentSettings.pagination) {
      // ページネーションが有効な場合、グリッドサイズに基づいてアイテム数を制限
      const maxItemsPerPage = currentSettings.columns * currentSettings.rows
      totalPages = Math.ceil(totalItems / maxItemsPerPage)

      const startIndex = (currentPage - 1) * maxItemsPerPage
      const endIndex = startIndex + maxItemsPerPage
      currentCharts = charts.slice(startIndex, endIndex)
    }

    return (
      <div className="h-full flex flex-col">
        <div className={cn("flex-1", currentSettings.pagination ? "overflow-hidden" : "overflow-auto")}>
          {/* パディングを調整 */}
          <div className="p-6 h-full flex flex-col">
            {/* ヘッダー部分 */}
            <div className="mb-6 flex-shrink-0">
              {/* ファイル名表示 */}
              {currentSettings.showFileName && <h2 className="text-2xl font-bold mb-2">{file.name}</h2>}

              {/* データソース表示 */}
              {currentSettings.showDataSources && file.dataSources && file.dataSources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {file.dataSources.map((source, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* グリッドレイアウト */}
            <div
              className={cn("grid", currentSettings.pagination ? "flex-1" : "")}
              style={{
                gridTemplateColumns: `repeat(${currentSettings.columns}, 1fr)`,
                ...(currentSettings.pagination && {
                  gridTemplateRows: `repeat(${currentSettings.rows}, 1fr)`,
                }),
                // 密なレイアウトの場合はギャップを小さく
                gap: isCompactLayout ? "12px" : "24px",
              }}
            >
              {currentCharts.map((chart) => (
                <div
                  key={chart.id}
                  className={cn(
                    "bg-card border rounded-lg flex flex-col relative group",
                    isCompactLayout ? "p-3" : "p-4",
                  )}
                  style={{
                    minHeight: `${cardMinHeight}px`,
                  }}
                  onMouseEnter={() => setHoveredChart(chart.id)}
                  onMouseLeave={() => setHoveredChart(null)}
                >
                  {/* Edit Button - appears on hover */}
                  {hoveredChart === chart.id && (
                    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
                          onClick={() => {
                            setEditingChart(chart)
                            setEditModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  )}

                  <h3
                    className={cn(
                      "font-semibold flex items-center gap-2 flex-shrink-0",
                      isCompactLayout ? "text-sm mb-2" : "text-lg mb-4",
                    )}
                  >
                    {chart.chartType === "bar" ? (
                      <BarChart3 className={cn(isCompactLayout ? "h-4 w-4" : "h-5 w-5")} />
                    ) : chart.chartType === "line" ? (
                      <LineChart className={cn(isCompactLayout ? "h-4 w-4" : "h-5 w-5")} />
                    ) : (
                      <PieChart className={cn(isCompactLayout ? "h-4 w-4" : "h-5 w-5")} />
                    )}
                    <span className="truncate">{chart.title}</span>
                  </h3>
                  <div
                    className="bg-muted rounded flex items-center justify-center flex-1"
                    style={{
                      minHeight: `${chartMinHeight}px`,
                    }}
                  >
                    <div className="text-center">
                      <div className={cn(isCompactLayout ? "text-2xl mb-1" : "text-4xl mb-2")}>📊</div>
                      <p className={cn("text-muted-foreground", isCompactLayout ? "text-xs" : "text-sm")}>
                        {chart.chartType?.toUpperCase()} Chart
                      </p>
                      <p className={cn("text-muted-foreground mt-1", isCompactLayout ? "text-xs" : "text-sm")}>
                        {chart.data.length} data points
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ページネーション - 画面下部に固定 */}
        {currentSettings.pagination && totalPages > 1 && (
          <div className="border-t bg-background py-4 px-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                Showing {(currentPage - 1) * (currentSettings.columns * currentSettings.rows) + 1} -{" "}
                {Math.min(currentPage * (currentSettings.columns * currentSettings.rows), totalItems)} of {totalItems}{" "}
                charts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chart Edit Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Chart: {editingChart?.title}</DialogTitle>
              <DialogDescription>
                Configure chart appearance, parameters, support lines, and view data source information.
              </DialogDescription>
            </DialogHeader>

            {editingChart && (
              <div className="space-y-8">
                {/* Appearance Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Appearance</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="chart-title">Title</Label>
                      <Input
                        id="chart-title"
                        value={editingChart.title}
                        onChange={(e) => {
                          setEditingChart({
                            ...editingChart,
                            title: e.target.value,
                          })
                        }}
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="show-legend"
                        checked={editingChart.legend ?? true}
                        onChange={(e) => {
                          setEditingChart({
                            ...editingChart,
                            legend: e.target.checked,
                          })
                        }}
                        className="rounded"
                      />
                      <Label htmlFor="show-legend">Show Legend</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="x-label">X-axis Label</Label>
                      <Input
                        id="x-label"
                        value={editingChart.xLabel || ""}
                        onChange={(e) => {
                          setEditingChart({
                            ...editingChart,
                            xLabel: e.target.value,
                          })
                        }}
                        placeholder="Enter X-axis label"
                      />
                    </div>

                    <div>
                      <Label htmlFor="y-label">Y-axis Label</Label>
                      <Input
                        id="y-label"
                        value={editingChart.yLabel || ""}
                        onChange={(e) => {
                          setEditingChart({
                            ...editingChart,
                            yLabel: e.target.value,
                          })
                        }}
                        placeholder="Enter Y-axis label"
                      />
                    </div>
                  </div>
                </div>

                {/* Parameter Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Parameters</h3>

                  {/* X Parameter Settings */}

                  <div className="space-y-4 p-4 border rounded-md">
                    <h4 className="font-medium">X Parameter Settings</h4>

                    <div className="flex items-center gap-3">
                      <div className="w-40">
                        <Label htmlFor="x-axis-type" className="text-xs">
                          Axis Type
                        </Label>
                        <select
                          id="x-axis-type"
                          className="w-full h-9 px-3 py-2 border rounded-md text-xs"
                          value={editingChart.xAxisType || "datetime"}
                          onChange={(e) => {
                            setEditingChart({
                              ...editingChart,
                              xAxisType: e.target.value as "datetime" | "time" | "parameter",
                              // Parameter以外が選ばれた場合はxParameterをクリア
                              ...(e.target.value !== "parameter" && { xParameter: "" }),
                            })
                          }}
                        >
                          <option value="datetime">Datetime</option>
                          <option value="time">Time (elapsed)</option>
                          <option value="parameter">Parameter</option>
                        </select>
                      </div>

                      <div className="flex-1">
                        <Label htmlFor="x-parameter" className="text-xs">
                          Parameter
                        </Label>
                        <Input
                          id="x-parameter"
                          value={editingChart.xParameter || ""}
                          onChange={(e) => {
                            setEditingChart({
                              ...editingChart,
                              xParameter: e.target.value,
                            })
                          }}
                          placeholder="Enter X parameter"
                          disabled={editingChart.xAxisType !== "parameter"}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="w-40">
                        <Label className="text-xs">Axis Range</Label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-9 text-xs">
                              {editingChart.xAxisRange?.auto === false &&
                              editingChart.xAxisRange?.min !== undefined &&
                              editingChart.xAxisRange?.max !== undefined
                                ? `${editingChart.xAxisRange.min}～${editingChart.xAxisRange.max}${
                                    editingChart.xAxisType === "time" && editingChart.xAxisRange.unit
                                      ? ` ${editingChart.xAxisRange.unit}`
                                      : ""
                                  }`
                                : "Auto"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>X-Axis Range Settings</DialogTitle>
                              <DialogDescription>Set the minimum and maximum values for the X-axis.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div>
                                <Label>Range Setting</Label>
                                <div className="flex gap-2 mt-1">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name="x-range-mode"
                                      checked={editingChart.xAxisRange?.auto !== false}
                                      onChange={() => {
                                        setEditingChart({
                                          ...editingChart,
                                          xAxisRange: {
                                            ...(editingChart.xAxisRange || {}),
                                            auto: true,
                                          },
                                        })
                                      }}
                                    />
                                    <span>Auto</span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name="x-range-mode"
                                      checked={editingChart.xAxisRange?.auto !== false}
                                      onChange={() => {
                                        setEditingChart({
                                          ...editingChart,
                                          xAxisRange: {
                                            ...(editingChart.xAxisRange || {}),
                                            auto: false,
                                          },
                                        })
                                      }}
                                    />
                                    <span>Manual</span>
                                  </label>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="x-range-min">Min Value</Label>
                                  <Input
                                    id="x-range-min"
                                    value={editingChart.xAxisRange?.min || ""}
                                    onChange={(e) => {
                                      setEditingChart({
                                        ...editingChart,
                                        xAxisRange: {
                                          ...(editingChart.xAxisRange || {}),
                                          min: e.target.value,
                                        },
                                      })
                                    }}
                                    placeholder={editingChart.xAxisType === "datetime" ? "YYYY-MM-DD" : "Min value"}
                                    disabled={editingChart.xAxisRange?.auto !== false}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="x-range-max">Max Value</Label>
                                  <Input
                                    id="x-range-max"
                                    value={editingChart.xAxisRange?.max || ""}
                                    onChange={(e) => {
                                      setEditingChart({
                                        ...editingChart,
                                        xAxisRange: {
                                          ...(editingChart.xAxisRange || {}),
                                          max: e.target.value,
                                        },
                                      })
                                    }}
                                    placeholder={editingChart.xAxisType === "datetime" ? "YYYY-MM-DD" : "Max value"}
                                    disabled={editingChart.xAxisRange?.auto !== false}
                                  />
                                </div>
                              </div>

                              {editingChart.xAxisType === "time" && (
                                <div>
                                  <Label htmlFor="x-range-unit">Unit</Label>
                                  <select
                                    id="x-range-unit"
                                    className="w-full mt-1 px-3 py-2 border rounded-md"
                                    value={editingChart.xAxisRange?.unit || "sec"}
                                    onChange={(e) => {
                                      setEditingChart({
                                        ...editingChart,
                                        xAxisRange: {
                                          ...(editingChart.xAxisRange || {}),
                                          unit: e.target.value as "sec" | "min" | "hr",
                                        },
                                      })
                                    }}
                                    disabled={editingChart.xAxisRange?.auto !== false}
                                  >
                                    <option value="sec">Seconds</option>
                                    <option value="min">Minutes</option>
                                    <option value="hr">Hours</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>

                  {/* Y Parameters Settings */}

                  <div className="space-y-4 p-4 border rounded-md">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Y Parameters Settings</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingChart({
                            ...editingChart,
                            yAxisParams: [
                              ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                              { parameter: "", axisName: "primary" },
                            ],
                          })
                        }}
                      >
                        Add Y Parameter
                      </Button>
                    </div>

                    <div className="space-y-1">
                      {/* テーブルヘッダー */}
                      <div className="grid grid-cols-12 gap-2 items-center text-xs font-medium text-muted-foreground border-b pb-1">
                        <div className="col-span-5">Parameter</div>
                        <div className="col-span-1">Axis No</div>
                        <div className="col-span-1">Marker</div>
                        <div className="col-span-1">Line</div>
                        <div className="col-span-2">Range</div>
                        <div className="col-span-1">Actions</div>
                      </div>

                      {/* パラメータ行 */}
                      {(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]).map((param, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center py-0.5 border-b border-muted/50 last:border-b-0">
                          {/* Parameter */}
                          <div className="col-span-5">
                            <Input
                              value={param.parameter}
                              onChange={(e) => {
                                const newParams = [
                                  ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                                ]
                                newParams[index] = { ...newParams[index], parameter: e.target.value }
                                setEditingChart({
                                  ...editingChart,
                                  yAxisParams: newParams,
                                })
                              }}
                              placeholder="Parameter name"
                              className="h-9 text-xs"
                            />
                          </div>

                          {/* Axis No */}
                          <div className="col-span-1">
                            <Input
                              type="number"
                              value={param.axisName}
                              onChange={(e) => {
                                const newParams = [
                                  ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                                ]
                                newParams[index] = { ...newParams[index], axisName: e.target.value }
                                setEditingChart({
                                  ...editingChart,
                                  yAxisParams: newParams,
                                })
                              }}
                              placeholder="1, 2, etc."
                              className="h-9 text-xs"
                            />
                          </div>

                          {/* Marker */}
                          <div className="col-span-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full h-9 flex items-center justify-center text-xs">
                                  <div
                                    style={{
                                      width: `${Math.min(param.marker?.size || 6, 8)}px`,
                                      height: `${Math.min(param.marker?.size || 6, 8)}px`,
                                      backgroundColor: param.marker?.fillColor || "#ffffff",
                                      borderColor: param.marker?.borderColor || "#000000",
                                      borderWidth: "1px",
                                      borderStyle: "solid",
                                      borderRadius:
                                        param.marker?.type === "circle"
                                          ? "50%"
                                          : param.marker?.type === "square"
                                            ? "0"
                                            : "0",
                                      transform:
                                        param.marker?.type === "triangle"
                                          ? "rotate(45deg)"
                                          : param.marker?.type === "diamond"
                                            ? "rotate(45deg)"
                                            : "none",
                                    }}
                                  ></div>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Marker Settings</DialogTitle>
                                  <DialogDescription>
                                    Configure the appearance of data point markers.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor={`marker-type-${index}`}>Type</Label>
                                      <select
                                        id={`marker-type-${index}`}
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        value={param.marker?.type || "circle"}
                                        onChange={(e) => {
                                          const newParams = [
                                            ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                                          ]
                                          newParams[index] = {
                                            ...newParams[index],
                                            marker: {
                                              ...(newParams[index].marker || {
                                                size: 6,
                                                borderColor: "#000000",
                                                fillColor: "#ffffff",
                                              }),
                                              type: e.target.value as "circle" | "square" | "triangle" | "diamond",
                                            },
                                          }
                                          setEditingChart({
                                            ...editingChart,
                                            yAxisParams: newParams,
                                          })
                                        }}
                                      >
                                        <option value="circle">Circle</option>
                                        <option value="square">Square</option>
                                        <option value="triangle">Triangle</option>
                                        <option value="diamond">Diamond</option>
                                      </select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`marker-size-${index}`}>Size</Label>
                                      <Input
                                        id={`marker-size-${index}`}
                                        type="number"
                                        value={param.marker?.size || 6}
                                        onChange={(e) => {
                                          const newParams = [
                                            ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                                          ]
                                          newParams[index] = {
                                            ...newParams[index],
                                            marker: {
                                              ...(newParams[index].marker || {
                                                type: "circle",
                                                borderColor: "#000000",
                                                fillColor: "#ffffff",
                                              }),
                                              size: Number(e.target.value),
                                            },
                                          }
                                          setEditingChart({
                                            ...editingChart,
                                            yAxisParams: newParams,
                                          })
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor={`marker-border-${index}`}>Border Color</Label>
                                      <div className="flex mt-1">
                                        <Input
                                          id={`marker-border-${index}`}
                                          type="color"
                                          value={param.marker?.borderColor || "#000000"}
                                          onChange={(e) => {
                                            const newParams = [
                                              ...(editingChart.yAxisParams || [
                                                { parameter: "", axisName: "primary" },
                                              ]),
                                            ]
                                            newParams[index] = {
                                              ...newParams[index],
                                              marker: {
                                                ...(newParams[index].marker || {
                                                  type: "circle",
                                                  size: 6,
                                                  fillColor: "#ffffff",
                                                }),
                                                borderColor: e.target.value,
                                              },
                                            }
                                            setEditingChart({
                                              ...editingChart,
                                              yAxisParams: newParams,
                                            })
                                          }}
                                          className="w-12 p-0 h-10"
                                        />
                                        <Input
                                          value={param.marker?.borderColor || "#000000"}
                                          onChange={(e) => {
                                            const newParams = [
                                              ...(editingChart.yAxisParams || [
                                                { parameter: "", axisName: "primary" },
                                              ]),
                                            ]
                                            newParams[index] = {
                                              ...newParams[index],
                                              marker: {
                                                ...(newParams[index].marker || {
                                                  type: "circle",
                                                  size: 6,
                                                  fillColor: "#ffffff",
                                                }),
                                                borderColor: e.target.value,
                                              },
                                            }
                                            setEditingChart({
                                              ...editingChart,
                                              yAxisParams: newParams,
                                            })
                                          }}
                                          className="flex-1 ml-2"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor={`marker-fill-${index}`}>Fill Color</Label>
                                      <div className="flex mt-1">
                                        <Input
                                          id={`marker-fill-${index}`}
                                          type="color"
                                          value={param.marker?.fillColor || "#ffffff"}
                                          onChange={(e) => {
                                            const newParams = [
                                              ...(editingChart.yAxisParams || [
                                                { parameter: "", axisName: "primary" },
                                              ]),
                                            ]
                                            newParams[index] = {
                                              ...newParams[index],
                                              marker: {
                                                ...(newParams[index].marker || {
                                                  type: "circle",
                                                  size: 6,
                                                  borderColor: "#000000",
                                                }),
                                                fillColor: e.target.value,
                                              },
                                            }
                                            setEditingChart({
                                              ...editingChart,
                                              yAxisParams: newParams,
                                            })
                                          }}
                                          className="w-12 p-0 h-10"
                                        />
                                        <Input
                                          value={param.marker?.fillColor || "#ffffff"}
                                          onChange={(e) => {
                                            const newParams = [
                                              ...(editingChart.yAxisParams || [
                                                { parameter: "", axisName: "primary" },
                                              ]),
                                            ]
                                            newParams[index] = {
                                              ...newParams[index],
                                              marker: {
                                                ...(newParams[index].marker || {
                                                  type: "circle",
                                                  size: 6,
                                                  borderColor: "#000000",
                                                }),
                                                fillColor: e.target.value,
                                              },
                                            }
                                            setEditingChart({
                                              ...editingChart,
                                              yAxisParams: newParams,
                                            })
                                          }}
                                          className="flex-1 ml-2"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <div
                                      className="bg-muted p-2 rounded-md flex items-center justify-center"
                                      style={{ height: "60px" }}
                                    >
                                      <div
                                        style={{
                                          width: `${param.marker?.size || 6}px`,
                                          height: `${param.marker?.size || 6}px`,
                                          backgroundColor: param.marker?.fillColor || "#ffffff",
                                          borderColor: param.marker?.borderColor || "#000000",
                                          borderWidth: "1px",
                                          borderStyle: "solid",
                                          borderRadius:
                                            param.marker?.type === "circle"
                                              ? "50%"
                                              : param.marker?.type === "square"
                                                ? "0"
                                                : "0",
                                          transform:
                                            param.marker?.type === "triangle"
                                              ? "rotate(45deg)"
                                              : param.marker?.type === "diamond"
                                                ? "rotate(45deg)"
                                                : "none",
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                                </DialogContent>
                              </Dialog>
                            </div>

                            {/* Line */}
                            <div className="col-span-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="w-full h-9 flex items-center justify-center text-xs">
                                    <div
                                      style={{
                                        width: "20px",
                                        height: "0px",
                                        borderTopWidth: `${Math.min(param.line?.width || 2, 3)}px`,
                                        borderTopStyle: param.line?.style || "solid",
                                        borderTopColor: param.line?.color || "#000000",
                                      }}
                                    ></div>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Line Settings</DialogTitle>
                                    <DialogDescription>
                                      Configure the appearance of the line connecting data points.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor={`line-width-${index}`}>Width</Label>
                                        <Input
                                          id={`line-width-${index}`}
                                          type="number"
                                          value={param.line?.width || 2}
                                          onChange={(e) => {
                                            const newParams = [
                                              ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                                            ]
                                            newParams[index] = {
                                              ...newParams[index],
                                              line: {
                                                ...(newParams[index].line || { color: "#000000", style: "solid" }),
                                                width: Number(e.target.value),
                                              },
                                            }
                                            setEditingChart({
                                              ...editingChart,
                                              yAxisParams: newParams,
                                            })
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor={`line-style-${index}`}>Style</Label>
                                        <select
                                          id={`line-style-${index}`}
                                          className="w-full mt-1 px-3 py-2 border rounded-md"
                                          value={param.line?.style || "solid"}
                                          onChange={(e) => {
                                            const newParams = [
                                              ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                                            ]
                                            newParams[index] = {
                                              ...newParams[index],
                                              line: {
                                                ...(newParams[index].line || { width: 2, color: "#000000" }),
                                                style: e.target.value as "solid" | "dashed" | "dotted",
                                              },
                                            }
                                            setEditingChart({
                                              ...editingChart,
                                              yAxisParams: newParams,
                                            })
                                          }}
                                        >
                                          <option value="solid">Solid</option>
                                          <option value="dashed">Dashed</option>
                                          <option value="dotted">Dotted</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor={`line-color-${index}`}>Color</Label>
                                      <div className="flex mt-1">
                                        <Input
                                          id={`line-color-${index}`}
                                          type="color"
                                          value={param.line?.color || "#000000"}
                                          onChange={(e) => {
                                            const newParams = [
                                              ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                                            ]
                                            newParams[index] = {
                                              ...newParams[index],
                                              line: {
                                                ...(newParams[index].line || { width: 2, style: "solid" }),
                                                color: e.target.value,
                                              },
                                            }
                                            setEditingChart({
                                              ...editingChart,
                                              yAxisParams: newParams,
                                            })
                                          }}
                                          className="w-12 p-0 h-10"
                                        />
                                        <Input
                                          value={param.line?.color || "#000000"}
                                          onChange={(e) => {
                                            const newParams = [
                                              ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                                            ]
                                            newParams[index] = {
                                              ...newParams[index],
                                              line: {
                                                ...(newParams[index].line || { width: 2, style: "solid" }),
                                                color: e.target.value,
                                              },
                                            }
                                            setEditingChart({
                                              ...editingChart,
                                              yAxisParams: newParams,
                                            })
                                          }}
                                          className="flex-1 ml-2"
                                        />
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <div className="bg-muted p-2 rounded-md" style={{ height: "60px" }}>
                                        <div
                                          style={{
                                            width: "100%",
                                            height: "1px",
                                            marginTop: "30px",
                                            backgroundColor: param.line?.color || "#000000",
                                            borderColor: param.line?.color || "#000000",
                                            borderWidth: `${param.line?.width || 2}px`,
                                            borderTopStyle: param.line?.style || "solid",
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>

                            {/* Axis Range */}
                            <div className="col-span-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="w-full h-9 text-xs">
                                    {param.range?.auto === false &&
                                    param.range?.min !== undefined &&
                                    param.range?.max !== undefined
                                      ? `${param.range.min}～${param.range.max}`
                                      : "Auto"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Y-Axis Range Settings</DialogTitle>
                                    <DialogDescription>
                                      Set the minimum and maximum values for the Y-axis parameter.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div>
                                      <Label>Range Setting</Label>
                                      <div className="flex gap-2 mt-1">
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name={`y-range-mode-${index}`}
                                            checked={param.range?.auto !== false}
                                            onChange={() => {
                                              const newParams = [
                                                ...(editingChart.yAxisParams || [
                                                  { parameter: "", axisName: "primary" },
                                                ]),
                                              ]
                                              newParams[index] = {
                                                ...newParams[index],
                                                range: {
                                                  ...(newParams[index].range || {}),
                                                  auto: true,
                                                },
                                              }
                                              setEditingChart({
                                                ...editingChart,
                                                yAxisParams: newParams,
                                              })
                                            }}
                                          />
                                          <span>Auto</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            name={`y-range-mode-${index}`}
                                            checked={param.range?.auto === false}
                                            onChange={() => {
                                              const newParams = [
                                                ...(editingChart.yAxisParams || [
                                                  { parameter: "", axisName: "primary" },
                                                ]),
                                              ]
                                              newParams[index] = {
                                                ...newParams[index],
                                                range: {
                                                  ...(newParams[index].range || {}),
                                                  auto: false,
                                                },
                                              }
                                              setEditingChart({
                                                ...editingChart,
                                                yAxisParams: newParams,
                                              })
                                            }}
                                          />
                                          <span>Manual</span>
                                        </label>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor={`y-range-min-${index}`}>Min Value</Label>
                                        <Input
                                          id={`y-range-min-${index}`}
                                          type="number"
                                          value={param.range?.min || ""}
                                          onChange={(e) => {
                                            const newParams = [
                                              ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                                            ]
                                            newParams[index] = {
                                              ...newParams[index],
                                              range: {
                                                ...(newParams[index].range || {}),
                                                min: Number(e.target.value),
                                              },
                                            }
                                            setEditingChart({
                                              ...editingChart,
                                              yAxisParams: newParams,
                                            })
                                          }}
                                          placeholder="Min value"
                                          disabled={param.range?.auto !== false}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor={`y-range-max-${index}`}>Max Value</Label>
                                        <Input
                                          id={`y-range-max-${index}`}
                                          type="number"
                                          value={param.range?.max || ""}
                                          onChange={(e) => {
                                            const newParams = [
                                              ...(editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]),
                                            ]
                                            newParams[index] = {
                                              ...newParams[index],
                                              range: {
                                                ...(newParams[index].range || {}),
                                                max: Number(e.target.value),
                                              },
                                            }
                                            setEditingChart({
                                              ...editingChart,
                                              yAxisParams: newParams,
                                            })
                                          }}
                                          placeholder="Max value"
                                          disabled={param.range?.auto !== false}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>

                            {/* Actions */}
                            <div className="col-span-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newParams = (
                                    editingChart.yAxisParams || [{ parameter: "", axisName: "primary" }]
                                  ).filter((_, i) => i !== index)
                                  setEditingChart({
                                    ...editingChart,
                                    yAxisParams:
                                      newParams.length > 0 ? newParams : [{ parameter: "", axisName: "primary" }],
                                  })
                                }}
                                disabled={(editingChart.yAxisParams || []).length <= 1}
                                className="h-9 w-full text-xs"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        
                      </div>
                    </div>
                  </div>

                {/* Support Line Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Support Lines</h3>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Vertical Lines */}
                    <div>
                      <Label className="text-sm font-medium">Vertical Lines</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto mt-2">
                        {editingChart.verticalLines?.map((line, index) => (
                          <div key={index} className="flex gap-2 items-center p-2 border rounded">
                            <Input
                              type="number"
                              value={line.value.toString()}
                              onChange={(e) => {
                                const newLines = [...(editingChart.verticalLines || [])]
                                newLines[index] = { ...newLines[index], value: Number(e.target.value) }
                                setEditingChart({
                                  ...editingChart,
                                  verticalLines: newLines,
                                })
                              }}
                              placeholder="Value"
                              className="w-20"
                            />
                            <Input
                              value={line.label || ""}
                              onChange={(e) => {
                                const newLines = [...(editingChart.verticalLines || [])]
                                newLines[index] = { ...newLines[index], label: e.target.value }
                                setEditingChart({
                                  ...editingChart,
                                  verticalLines: newLines,
                                })
                              }}
                              placeholder="Label"
                              className="flex-1"
                            />
                            <Input
                              type="color"
                              value={line.color || "#000000"}
                              onChange={(e) => {
                                const newLines = [...(editingChart.verticalLines || [])]
                                newLines[index] = { ...newLines[index], color: e.target.value }
                                setEditingChart({
                                  ...editingChart,
                                  verticalLines: newLines,
                                })
                              }}
                              className="w-12"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newLines = (editingChart.verticalLines || []).filter((_, i) => i !== index)
                                setEditingChart({
                                  ...editingChart,
                                  verticalLines: newLines,
                                })
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingChart({
                            ...editingChart,
                            verticalLines: [
                              ...(editingChart.verticalLines || []),
                              { value: 0, label: "", color: "#000000" },
                            ],
                          })
                        }}
                        className="mt-2 w-full"
                      >
                        Add Vertical Line
                      </Button>
                    </div>

                    {/* Horizontal Lines */}
                    <div>
                      <Label className="text-sm font-medium">Horizontal Lines</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto mt-2">
                        {(editingChart.horizontalLines || []).map((line, index) => (
                          <div key={index} className="flex gap-2 items-center p-2 border rounded">
                            <Input
                              type="number"
                              value={line.value}
                              onChange={(e) => {
                                const newLines = [...(editingChart.horizontalLines || [])]
                                newLines[index] = { ...newLines[index], value: Number(e.target.value) }
                                setEditingChart({
                                  ...editingChart,
                                  horizontalLines: newLines,
                                })
                              }}
                              placeholder="Value"
                              className="w-20"
                            />
                            <Input
                              value={line.label || ""}
                              onChange={(e) => {
                                const newLines = [...(editingChart.horizontalLines || [])]
                                newLines[index] = { ...newLines[index], label: e.target.value }
                                setEditingChart({
                                  ...editingChart,
                                  horizontalLines: newLines,
                                })
                              }}
                              placeholder="Label"
                              className="flex-1"
                            />
                            <Input
                              type="color"
                              value={line.color || "#000000"}
                              onChange={(e) => {
                                const newLines = [...(editingChart.horizontalLines || [])]
                                newLines[index] = { ...newLines[index], color: e.target.value }
                                setEditingChart({
                                  ...editingChart,
                                  horizontalLines: newLines,
                                })
                              }}
                              className="w-12"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newLines = (editingChart.horizontalLines || []).filter((_, i) => i !== index)
                                setEditingChart({
                                  ...editingChart,
                                  horizontalLines: newLines,
                                })
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingChart({
                            ...editingChart,
                            horizontalLines: [
                              ...(editingChart.horizontalLines || []),
                              { value: 0, label: "", color: "#000000" },
                            ],
                          })
                        }}
                        className="mt-2 w-full"
                      >
                        Add Horizontal Line
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Data Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Data Source</h3>

                  {editingChart.dataSource ? (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium">Source Name</Label>
                          <p className="text-sm text-muted-foreground">{editingChart.dataSource.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Table</Label>
                          <p className="text-sm text-muted-foreground">{editingChart.dataSource.table}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Last Updated</Label>
                          <p className="text-sm text-muted-foreground">{editingChart.dataSource.lastUpdated}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Columns</Label>
                          <p className="text-sm text-muted-foreground">{editingChart.dataSource.columns.join(", ")}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Preview Data</Label>
                        <div className="border rounded overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="px-3 py-2 text-left">Name</th>
                                <th className="px-3 py-2 text-left">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {editingChart.data.slice(0, 5).map((item, index) => (
                                <tr key={index} className="border-t">
                                  <td className="px-3 py-2">{item.name}</td>
                                  <td className="px-3 py-2">{item.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {editingChart.data.length > 5 && (
                            <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-t">
                              ... and {editingChart.data.length - 5} more rows
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">No data source configured</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditModalOpen(false)
                      setEditingChart(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Here you would typically save the changes
                      console.log("Saving chart changes:", editingChart)
                      setEditModalOpen(false)
                      setEditingChart(null)
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Activity Bar */}
      <div className="w-12 bg-muted border-r flex flex-col">
        <Button
          variant={activeView === "explorer" ? "secondary" : "ghost"}
          size="icon"
          className="h-12 w-12 rounded-none"
          onClick={() => handleViewClick("explorer")}
        >
          <FolderOpen className="h-5 w-5" />
        </Button>
        <Button
          variant={activeView === "search" ? "secondary" : "ghost"}
          size="icon"
          className="h-12 w-12 rounded-none"
          onClick={() => handleViewClick("search")}
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button
          variant={activeView === "database" ? "secondary" : "ghost"}
          size="icon"
          className="h-12 w-12 rounded-none"
          onClick={() => handleViewClick("database")}
        >
          <Database className="h-5 w-5" />
        </Button>
        <Button
          variant={activeView === "settings" ? "secondary" : "ghost"}
          size="icon"
          className="h-12 w-12 rounded-none"
          onClick={() => handleViewClick("settings")}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      <ResizablePanelGroup direction="horizontal">
        {/* Sidebar */}
        {sidebarOpen && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <div className="h-full bg-muted/50 border-r">
                {activeView === "explorer" && (
                  <div className="p-2">
                    <h3 className="text-sm font-semibold mb-2 px-2">EXPLORER</h3>
                    <ScrollArea className="h-[calc(100vh-60px)]">{renderFileTree(mockFileTree)}</ScrollArea>
                  </div>
                )}
                {activeView === "search" && (
                  <div className="p-4">
                    <h3 className="text-sm font-semibold mb-4">SEARCH</h3>
                    <p className="text-sm text-muted-foreground">Search functionality coming soon...</p>
                  </div>
                )}
                {activeView === "database" && (
                  <div className="p-4">
                    <h3 className="text-sm font-semibold mb-4">DATABASE</h3>
                    <p className="text-sm text-muted-foreground">Database management coming soon...</p>
                  </div>
                )}
                {activeView === "settings" && (
                  <div className="p-4">
                    <h3 className="text-sm font-semibold mb-4">SETTINGS</h3>
                    <p className="text-sm text-muted-foreground">Settings panel coming soon...</p>
                  </div>
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}

        {/* Main Content Area */}
        <ResizablePanel defaultSize={sidebarOpen ? 80 : 100}>
          <div className="h-full flex flex-col">
            {/* Tab Bar */}
            {openTabs.length > 0 && (
              <div className="border-b bg-background">
                <ScrollArea orientation="horizontal">
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      {openTabs.map((tab) => (
                        <div
                          key={tab.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, tab.id)}
                          onDragOver={(e) => handleDragOver(e, tab.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, tab.id)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 border-r cursor-pointer min-w-0 max-w-48 select-none",
                            activeTab === tab.id ? "bg-background" : "bg-muted/50 hover:bg-muted",
                            draggedTab === tab.id && "opacity-50",
                            dragOverTab === tab.id && "border-l-2 border-l-blue-500",
                          )}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <File className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm truncate">{tab.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 flex-shrink-0 hover:bg-accent"
                            onClick={(e) => {
                              e.stopPropagation()
                              closeTab(tab.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="px-2 flex items-center gap-1">
                      {/* Layout Settings Button */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <LayoutGrid className="h-4 w-4" />
                            <span className="sr-only">Layout Settings</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                          <DropdownMenuLabel>Layout Settings</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {/* Grid Settings */}
                          <div className="p-3">
                            <h4 className="text-sm font-medium mb-3">Grid Layout</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-muted-foreground">Columns</label>
                                <select
                                  className="w-full mt-1 px-2 py-1 text-sm border rounded"
                                  value={getCurrentLayoutSettings().columns}
                                  onChange={(e) => {
                                    const currentSettings = getCurrentLayoutSettings()
                                    updateLayoutSettings({
                                      ...currentSettings,
                                      columns: Number.parseInt(e.target.value),
                                    })
                                  }}
                                >
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3</option>
                                  <option value={4}>4</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Rows</label>
                                <select
                                  className="w-full mt-1 px-2 py-1 text-sm border rounded"
                                  value={getCurrentLayoutSettings().rows}
                                  onChange={(e) => {
                                    const currentSettings = getCurrentLayoutSettings()
                                    updateLayoutSettings({
                                      ...currentSettings,
                                      rows: Number.parseInt(e.target.value),
                                    })
                                  }}
                                >
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3</option>
                                  <option value={4}>4</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <DropdownMenuSeparator />

                          {/* Pagination Settings */}
                          <div className="p-3">
                            <h4 className="text-sm font-medium mb-3">Pagination</h4>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="pagination"
                                checked={getCurrentLayoutSettings().pagination}
                                onChange={(e) => {
                                  const currentSettings = getCurrentLayoutSettings()
                                  updateLayoutSettings({
                                    ...currentSettings,
                                    pagination: e.target.checked,
                                  })
                                }}
                                className="rounded"
                              />
                              <label htmlFor="pagination" className="text-xs">
                                Enable pagination
                              </label>
                            </div>
                          </div>

                          <DropdownMenuSeparator />

                          {/* Display Settings */}
                          <div className="p-3">
                            <h4 className="text-sm font-medium mb-3">Display Options</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="showFileName"
                                  checked={getCurrentLayoutSettings().showFileName}
                                  onChange={(e) => {
                                    const currentSettings = getCurrentLayoutSettings()
                                    updateLayoutSettings({
                                      ...currentSettings,
                                      showFileName: e.target.checked,
                                    })
                                  }}
                                  className="rounded"
                                />
                                <label htmlFor="showFileName" className="text-xs">
                                  Show file name
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="showDataSources"
                                  checked={getCurrentLayoutSettings().showDataSources}
                                  onChange={(e) => {
                                    const currentSettings = getCurrentLayoutSettings()
                                    updateLayoutSettings({
                                      ...currentSettings,
                                      showDataSources: e.target.checked,
                                    })
                                  }}
                                  className="rounded"
                                />
                                <label htmlFor="showDataSources" className="text-xs">
                                  Show data sources
                                </label>
                              </div>
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Breadcrumb */}
            {activeTab && openTabs.find((tab) => tab.id === activeTab) && (
              <div className="border-b bg-background px-4 py-2">
                <Breadcrumb>
                  <BreadcrumbList>
                    {(() => {
                      const currentFile = openTabs.find((tab) => tab.id === activeTab)
                      if (!currentFile) return null

                      const filePath = getFilePath(currentFile.id, mockFileTree)
                      if (!filePath) return null

                      return filePath.map((pathItem, index) => (
                        <React.Fragment key={index}>
                          {index === filePath.length - 1 ? (
                            <BreadcrumbItem>
                              <BreadcrumbPage>{pathItem}</BreadcrumbPage>
                            </BreadcrumbItem>
                          ) : (
                            <>
                              <BreadcrumbItem>
                                <BreadcrumbLink href="#" className="text-muted-foreground">
                                  {pathItem}
                                </BreadcrumbLink>
                              </BreadcrumbItem>
                              <BreadcrumbSeparator />
                            </>
                          )}
                        </React.Fragment>
                      ))
                    })()}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {activeTab && openTabs.find((tab) => tab.id === activeTab) ? (
                renderChart(openTabs.find((tab) => tab.id === activeTab)!)
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-xl font-semibold mb-2">Analysis Tool</h2>
                    <p>Select a chart file from the Explorer to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
