import * as d3 from 'd3'
import { ChartComponent, EventInfo } from '@/types'

export const renderNoDataDisplay = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number,
  chart: ChartComponent,
  dataSources: EventInfo[]
) => {
  // Check configuration status
  const hasDataSources = dataSources.length > 0
  const hasXParameter = !!chart.xParameter || chart.xAxisType === "datetime" || chart.xAxisType === "time"
  const yAxisParams = chart.yAxisParams || []
  const hasYParameters = yAxisParams.length > 0 && yAxisParams.some(p => p.parameter)
  const validYParams = yAxisParams.filter(p => p.parameter)

  const centerX = width / 2
  const centerY = height / 2
  
  // Use ALL available space
  const isCompact = width < 400 || height < 300
  const margin = 2 // Ultra minimal margin
  const boxWidth = width - (margin * 2)
  const boxHeight = height - (margin * 2)
  const startX = margin
  const startY = margin

  // Background box - very subtle
  g.append("rect")
    .attr("x", startX)
    .attr("y", startY)
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("rx", 2)
    .attr("fill", "#fcfcfc")
    .attr("stroke", "#f0f0f0")
    .attr("stroke-width", 0.5)

  // Calculate dynamic font sizes - MUCH larger to fill space
  const baseFontSize = Math.max(16, Math.min(32, height / 8))
  const titleFontSize = Math.min(baseFontSize + 4, height / 6)
  const statusFontSize = baseFontSize
  const iconFontSize = baseFontSize + 4

  let currentY = startY + titleFontSize * 0.8

  // Chart title (if exists)
  if (chart.title) {
    const maxTitleWidth = boxWidth - 10
    const titleText = g.append("text")
      .attr("x", centerX)
      .attr("y", currentY)
      .attr("text-anchor", "middle")
      .attr("font-size", `${titleFontSize}px`)
      .attr("font-weight", "700")
      .style("fill", "#1f2937")
      .text(chart.title)
    
    // Truncate if too long
    let titleNode = titleText.node()
    if (titleNode && titleNode.getComputedTextLength() > maxTitleWidth) {
      let truncatedTitle = chart.title
      while (titleNode.getComputedTextLength() > maxTitleWidth && truncatedTitle.length > 0) {
        truncatedTitle = truncatedTitle.slice(0, -1)
        titleText.text(truncatedTitle + "...")
      }
    }
    currentY += titleFontSize * 1.2
  }

  // Configuration status
  const statusItems: Array<{
    label: string
    status: boolean
    text: string
    tooltip?: string | null
  }> = [
    {
      label: "Data",
      status: hasDataSources,
      text: hasDataSources 
        ? `${dataSources.length} selected`
        : "None selected"
    },
    {
      label: "X-axis",
      status: hasXParameter,
      text: hasXParameter
        ? chart.xAxisType === "datetime" 
          ? "Datetime"
          : chart.xAxisType === "time"
          ? "Time"
          : chart.xParameter || "Selected"
        : "Not configured"
    },
    {
      label: "Y-axis",
      status: hasYParameters,
      text: hasYParameters
        ? validYParams[0].parameter + (validYParams.length > 1 ? ` +${validYParams.length - 1} more` : "")
        : "Not configured",
      tooltip: validYParams.length > 1 
        ? validYParams.map(p => p.parameter).join(", ")
        : null
    }
  ]

  // Calculate optimal spacing to fill ALL available height
  const remainingHeight = boxHeight - (currentY - startY) - 10 // Tiny bottom margin
  const itemSpacing = remainingHeight / statusItems.length
  
  // Use full width for horizontal spacing
  const iconX = startX + 15
  const labelX = iconX + iconFontSize + 10
  const statusX = Math.max(labelX + 80, width * 0.35)
  
  statusItems.forEach((item, index) => {
    const yPos = currentY + (index + 0.5) * itemSpacing
    
    // Status icon - LARGE
    g.append("text")
      .attr("x", iconX)
      .attr("y", yPos)
      .attr("font-size", `${iconFontSize}px`)
      .attr("font-weight", "bold")
      .style("fill", item.status ? "#10b981" : "#ef4444")
      .text(item.status ? "✓" : "✗")
    
    // Label
    g.append("text")
      .attr("x", labelX)
      .attr("y", yPos)
      .attr("font-size", `${statusFontSize}px`)
      .attr("font-weight", "500")
      .style("fill", "#6b7280")
      .text(`${item.label}:`)
    
    // Status text group (for tooltip support)
    const textGroup = g.append("g")
    
    // Calculate available width for status text
    const maxStatusWidth = boxWidth - statusX + startX - 10
    
    const statusText = textGroup.append("text")
      .attr("x", statusX)
      .attr("y", yPos)
      .attr("font-size", `${statusFontSize}px`)
      .attr("font-weight", "500")
      .style("fill", "#374151")
      .text(item.text)
    
    // Check if text needs truncation
    const statusNode = statusText.node()
    if (statusNode && statusNode.getComputedTextLength() > maxStatusWidth) {
      let truncatedText = item.text
      while (statusNode.getComputedTextLength() > maxStatusWidth && truncatedText.length > 0) {
        truncatedText = truncatedText.slice(0, -1)
        statusText.text(truncatedText + "...")
      }
      
      // Add hover tooltip for full text
      const fullTextTooltip = g.append("g")
        .style("visibility", "hidden")
        .attr("class", "full-text-tooltip")
      
      const tooltipBg = fullTextTooltip.append("rect")
        .attr("fill", "rgba(0, 0, 0, 0.85)")
        .attr("rx", 3)
        .attr("stroke", "none")
      
      const tooltipText = fullTextTooltip.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "white")
        .attr("font-size", `${Math.max(12, baseFontSize - 2)}px`)
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "start")
        .text(item.text)
      
      const bbox = tooltipText.node()?.getBBox()
      if (bbox) {
        const padding = 8
        tooltipBg
          .attr("x", -padding)
          .attr("y", bbox.y - padding)
          .attr("width", bbox.width + padding * 2)
          .attr("height", bbox.height + padding * 2)
        
        // Position tooltip - ensure it stays within bounds
        const tooltipWidth = bbox.width + padding * 2
        // Ensure tooltip doesn't go past left or right edges
        let tooltipX = statusX
        if (tooltipX + tooltipWidth > boxWidth - 5) {
          tooltipX = boxWidth - tooltipWidth - 5
        }
        if (tooltipX < startX + 5) {
          tooltipX = startX + 5
        }
        const tooltipY = yPos - bbox.height - padding * 2 - 5
        
        fullTextTooltip.attr("transform", `translate(${tooltipX}, ${tooltipY})`)
      }
      
      statusText.style("cursor", "pointer")
      textGroup
        .on("mouseenter", () => fullTextTooltip.style("visibility", "visible"))
        .on("mouseleave", () => fullTextTooltip.style("visibility", "hidden"))
    }
    
    // Add tooltip for "+N more" parameters (only if not already truncated)
    if (item.tooltip && statusNode && statusNode.getComputedTextLength() <= maxStatusWidth) {
      // Create tooltip rect
      const tooltipGroup = g.append("g")
        .style("visibility", "hidden")
        .attr("class", "tooltip-group")
      
      const tooltipText = item.tooltip
      const tooltipPadding = 8
      const tooltipFontSize = Math.max(12, baseFontSize - 2)
      
      // Background rect for tooltip
      const tooltipBg = tooltipGroup.append("rect")
        .attr("fill", "rgba(0, 0, 0, 0.8)")
        .attr("rx", 3)
        .attr("stroke", "none")
      
      // Tooltip text - split parameters into separate lines
      const parameters = tooltipText.split(", ")
      const lineHeight = tooltipFontSize * 1.2
      
      // Create text element for multiline text
      const tooltipTextGroup = tooltipGroup.append("g")
      
      parameters.forEach((param, idx) => {
        tooltipTextGroup.append("text")
          .attr("x", 0)
          .attr("y", idx * lineHeight)
          .attr("fill", "white")
          .attr("font-size", `${tooltipFontSize}px`)
          .attr("dominant-baseline", "text-before-edge")
          .attr("text-anchor", "start")
          .text(param)
      })
      
      // Position tooltip after text is rendered
      const bbox = tooltipTextGroup.node()?.getBBox()
      if (bbox) {
        tooltipBg
          .attr("x", -tooltipPadding)
          .attr("y", -tooltipPadding)
          .attr("width", bbox.width + tooltipPadding * 2)
          .attr("height", bbox.height + tooltipPadding * 2)
        
        // Position tooltip - ensure it stays within bounds
        const tooltipWidth = bbox.width + tooltipPadding * 2
        // Ensure tooltip doesn't go past left or right edges
        let tooltipX = statusX
        if (tooltipX + tooltipWidth > boxWidth - 5) {
          tooltipX = boxWidth - tooltipWidth - 5
        }
        if (tooltipX < startX + 5) {
          tooltipX = startX + 5
        }
        const tooltipY = yPos - bbox.height - tooltipPadding * 2 - 5
        
        tooltipGroup.attr("transform", `translate(${tooltipX}, ${tooltipY})`)
      }
      
      // Underline the "+N more" part
      const moreMatch = item.text.match(/(\+\d+ more)/)
      if (moreMatch) {
        statusText.style("text-decoration", "underline")
          .style("text-decoration-style", "dotted")
          .style("cursor", "pointer")
      }
      
      // Show/hide tooltip on hover
      textGroup
        .on("mouseenter", () => tooltipGroup.style("visibility", "visible"))
        .on("mouseleave", () => tooltipGroup.style("visibility", "hidden"))
    }
  })

  // Skip hint text to save space
}