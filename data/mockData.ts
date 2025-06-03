import { FileNode } from "@/types"

export const mockFileTree: FileNode[] = [
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
        ],
      },
      {
        id: "3",
        name: "Customer Insights",
        type: "file",
        dataSources: ["CRM System", "Analytics DB"],
        charts: [
          {
            id: "chart-100",
            title: "Customer Segments",
            chartType: "pie",
            data: [
              { name: "Enterprise", value: 45 },
              { name: "SMB", value: 30 },
              { name: "Startup", value: 25 },
            ],
          },
          {
            id: "chart-101",
            title: "Customer Growth",
            chartType: "line",
            data: [
              { name: "Q1", value: 1200 },
              { name: "Q2", value: 1400 },
              { name: "Q3", value: 1600 },
              { name: "Q4", value: 2000 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "4",
    name: "Marketing Reports",
    type: "folder",
    children: [
      {
        id: "5",
        name: "Campaign Performance",
        type: "file",
        dataSources: ["Marketing API", "Social Media Data"],
        charts: [
          {
            id: "chart-200",
            title: "Campaign ROI",
            chartType: "bar",
            data: [
              { name: "Email", value: 320 },
              { name: "Social", value: 280 },
              { name: "PPC", value: 450 },
              { name: "Content", value: 180 },
            ],
          },
        ],
      },
    ],
  },
]