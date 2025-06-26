"use client"

import React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CSVDataSourceType } from '@/types'
import { getDataSourceTypes, getDataSourceConfig } from '@/data/dataSourceTypes'
import { PlantMachineFields } from '@/components/charts/EditModal/parameters/PlantMachineFields'

interface DataSourceInfoSectionProps {
  dataSourceType: CSVDataSourceType
  setDataSourceType: (type: CSVDataSourceType) => void
  plant: string
  setPlant: (plant: string) => void
  machineNo: string
  setMachineNo: (machineNo: string) => void
}

export function DataSourceInfoSection({
  dataSourceType,
  setDataSourceType,
  plant,
  setPlant,
  machineNo,
  setMachineNo
}: DataSourceInfoSectionProps) {
  const dataSourceTypes = getDataSourceTypes()
  const dataSourceConfig = getDataSourceConfig(dataSourceType)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Source Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dataSourceType">Data Source Type</Label>
          <Select value={dataSourceType} onValueChange={(value) => setDataSourceType(value as CSVDataSourceType)}>
            <SelectTrigger id="dataSourceType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dataSourceTypes.map((type) => {
                const config = getDataSourceConfig(type)
                return (
                  <SelectItem key={type} value={type}>
                    {config.name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {dataSourceConfig.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">
            Plant * / Machine No *
          </div>
          <PlantMachineFields
            plant={plant}
            onPlantChange={setPlant}
            machineNo={machineNo}
            onMachineNoChange={setMachineNo}
          />
        </div>
      </CardContent>
    </Card>
  )
}