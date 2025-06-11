import { ChartComponent, InterlockDefinition, InterlockMaster } from "@/types"
import { useInterlockMasterStore } from "@/stores/useInterlockMasterStore"
import { useFormulaMasterStore } from "@/stores/useFormulaMasterStore"
import { FormulaMaster } from "@/data/formulaMaster"
import { formulaMasterToDefinition } from "@/utils/formulaUtils"

interface UseYParameterHandlersProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  setEditingInterlockIndex: (index: number | null) => void
  setInterlockMode: (mode: "create" | "edit" | "duplicate") => void
  setShowInterlockDialog: (show: boolean) => void
  setEditingFormulaIndex: (index: number | null) => void
  setFormulaMode: (mode: "create" | "edit" | "duplicate") => void
  setShowFormulaDialog: (show: boolean) => void
  setOpenComboboxIndex: (index: number | null) => void
  setSearchQuery: (query: string) => void
}

export function useYParameterHandlers({
  editingChart,
  setEditingChart,
  setEditingInterlockIndex,
  setInterlockMode,
  setShowInterlockDialog,
  setEditingFormulaIndex,
  setFormulaMode,
  setShowFormulaDialog,
  setOpenComboboxIndex,
  setSearchQuery
}: UseYParameterHandlersProps) {
  // Get interlocks from the store
  const { interlocks, addInterlock, updateInterlock } = useInterlockMasterStore()
  // Get formulas from the store
  const { formulas, addFormula, updateFormula } = useFormulaMasterStore()
  
  const handleFormulaSave = (formula: FormulaMaster, index: number) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    newParams[index] = {
      ...newParams[index],
      parameter: formula.name,
      formulaId: formula.id,
      formulaDefinition: formulaMasterToDefinition(formula),
      unit: undefined,  // Reset to formula's default unit
      unitConversionId: undefined  // Clear conversion
    }
    setEditingChart({ ...editingChart, yAxisParams: newParams })
    
    // Use the Formula Store instead of mockFormulaMaster
    const existingFormula = formulas.find(f => f.id === formula.id)
    if (!existingFormula) {
      addFormula(formula)
    } else {
      updateFormula(formula.id, formula)
    }
    setEditingFormulaIndex(null)
  }

  const handleInterlockSave = (interlockDefinition: InterlockDefinition, selectedThresholds: string[], plant: string, machineNo: string, index: number) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    const finalSelectedThresholds = selectedThresholds.length > 0 
      ? selectedThresholds 
      : interlockDefinition.thresholds.map(t => t.id)
    
    // Create or update interlock in the store
    const currentParam = newParams[index]
    const isEditingExisting = currentParam?.interlockSource === "master" && currentParam?.interlockId
    
    if (isEditingExisting) {
      // Update existing interlock in store
      const existingInterlock = interlocks.find(i => i.id === currentParam.interlockId)
      if (existingInterlock) {
        const updatedInterlock = {
          ...existingInterlock,
          name: interlockDefinition.name,
          plant_name: plant,
          machine_no: machineNo,
          definition: interlockDefinition,
          updatedAt: new Date().toISOString()
        }
        updateInterlock(updatedInterlock)
      }
    } else {
      // Add new interlock to store for custom interlocks
      const newInterlock = {
        id: `custom-${Date.now()}`,
        name: interlockDefinition.name,
        category: "Custom",
        plant_name: plant,
        machine_no: machineNo,
        definition: interlockDefinition,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      addInterlock(newInterlock)
      
      // Update the parameter to reference the new interlock
      newParams[index] = {
        ...newParams[index],
        interlockId: newInterlock.id,
        interlockSource: "master",
        interlockDefinition,
        parameter: interlockDefinition.name,
        selectedThresholds: finalSelectedThresholds,
        unit: undefined,  // Reset to interlock's default unit
        unitConversionId: undefined  // Clear conversion
      }
      setEditingChart({ ...editingChart, yAxisParams: newParams })
      setEditingInterlockIndex(null)
      return
    }
    
    newParams[index] = {
      ...newParams[index],
      interlockDefinition,
      parameter: interlockDefinition.name,
      interlockSource: currentParam?.interlockSource || "custom",
      selectedThresholds: finalSelectedThresholds,
      unit: undefined,  // Reset to interlock's default unit
      unitConversionId: undefined  // Clear conversion
    }
    setEditingChart({ ...editingChart, yAxisParams: newParams })
    setEditingInterlockIndex(null)
  }

  const handleParameterTypeChange = (index: number, newType: "Parameter" | "Formula" | "Interlock") => {
    const newParams = [...(editingChart.yAxisParams || [])]
    newParams[index] = { 
      ...newParams[index], 
      parameterType: newType,
      parameter: "",
      axisNo: 1,
      unit: undefined,  // Reset unit when type changes
      unitConversionId: undefined,  // Clear conversion
      ...(newType !== "Interlock" && {
        interlockId: undefined,
        interlockSource: undefined,
        interlockDefinition: undefined,
        selectedThresholds: undefined
      }),
      ...(newType !== "Formula" && {
        formulaId: undefined,
        formulaDefinition: undefined
      })
    }
    setEditingChart({ ...editingChart, yAxisParams: newParams })
  }

  const handleFormulaSelect = (index: number, value: string, mode: "select" | "edit" | "duplicate" = "select") => {
    setOpenComboboxIndex(null)
    setSearchQuery("")
    
    if (value === "add-new") {
      setEditingFormulaIndex(index)
      setFormulaMode("create")
      setShowFormulaDialog(true)
      return
    }

    const selectedFormula = formulas.find(f => f.id === value)
    if (selectedFormula) {
      if (mode === "edit" || mode === "duplicate") {
        setEditingFormulaIndex(index)
        setFormulaMode(mode)
        const newParams = [...(editingChart.yAxisParams || [])]
        newParams[index] = {
          ...newParams[index],
          formulaDefinition: formulaMasterToDefinition(selectedFormula)
        }
        setEditingChart({ ...editingChart, yAxisParams: newParams })
        setShowFormulaDialog(true)
      } else {
        const newParams = [...(editingChart.yAxisParams || [])]
        newParams[index] = {
          ...newParams[index],
          parameter: selectedFormula.name,
          formulaId: value,
          formulaDefinition: formulaMasterToDefinition(selectedFormula),
          unit: undefined,  // Reset to formula's default unit
          unitConversionId: undefined  // Clear conversion
        }
        setEditingChart({ ...editingChart, yAxisParams: newParams })
      }
    }
  }

  const handleInterlockSelect = (index: number, value: string, mode: "select" | "edit" | "duplicate" = "select") => {
    setOpenComboboxIndex(null)
    setSearchQuery("")
    
    if (value === "add-new") {
      setEditingInterlockIndex(index)
      setInterlockMode("create")
      const newParams = [...(editingChart.yAxisParams || [])]
      if (newParams[index]) {
        newParams[index] = {
          ...newParams[index],
          interlockDefinition: undefined,
          selectedThresholds: undefined
        }
      }
      setEditingChart({ ...editingChart, yAxisParams: newParams })
      setShowInterlockDialog(true)
      return
    }

    const selectedMaster = interlocks.find(m => m.id === value)
    if (selectedMaster) {
      if (mode === "edit" || mode === "duplicate") {
        setEditingInterlockIndex(index)
        setInterlockMode(mode)
        const newParams = [...(editingChart.yAxisParams || [])]
        
        const definitionToUse = mode === "duplicate" 
          ? {
              ...selectedMaster.definition,
              name: `${selectedMaster.definition.name} (Copy)`
            }
          : selectedMaster.definition
        
        newParams[index] = {
          ...newParams[index],
          interlockDefinition: definitionToUse,
          selectedThresholds: selectedMaster.definition.thresholds.map(t => t.id),
          interlockSource: "custom",
        }
        setEditingChart({ ...editingChart, yAxisParams: newParams })
        setShowInterlockDialog(true)
      } else {
        const newParams = [...(editingChart.yAxisParams || [])]
        const allThresholdIds = selectedMaster.definition.thresholds.map(t => t.id)
        newParams[index] = {
          ...newParams[index],
          interlockId: value,
          interlockSource: "master",
          interlockDefinition: selectedMaster.definition,
          parameter: selectedMaster.name,
          selectedThresholds: allThresholdIds,
          unit: undefined,  // Reset to interlock's default unit
          unitConversionId: undefined  // Clear conversion
        }
        setEditingChart({ ...editingChart, yAxisParams: newParams })
      }
    }
  }

  const handleThresholdRemove = (paramIndex: number, thresholdId: string) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    const currentSelectedThresholds = newParams[paramIndex].selectedThresholds || []
    newParams[paramIndex] = {
      ...newParams[paramIndex],
      selectedThresholds: currentSelectedThresholds.filter(id => id !== thresholdId)
    }
    setEditingChart({ ...editingChart, yAxisParams: newParams })
  }

  const handleThresholdAdd = (paramIndex: number, thresholdId: string) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    const currentSelectedThresholds = newParams[paramIndex].selectedThresholds || []
    if (!currentSelectedThresholds.includes(thresholdId)) {
      newParams[paramIndex] = {
        ...newParams[paramIndex],
        selectedThresholds: [...currentSelectedThresholds, thresholdId]
      }
      setEditingChart({ ...editingChart, yAxisParams: newParams })
    }
  }

  const filterFormulas = (formulas: FormulaMaster[]) => {
    const query: string = "" // This will be passed from the component
    if (!query) return formulas

    return formulas.filter(formula => {
      const searchableText = [
        formula.name,
        formula.description,
        formula.category,
        formula.expression
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query.toLowerCase())
    })
  }

  const filterInterlocks = (interlocks: InterlockMaster[]) => {
    const query: string = "" // This will be passed from the component
    if (!query) return interlocks

    return interlocks.filter((master: InterlockMaster) => {
      const searchableText = [
        master.name,
        master.plant_name,
        master.machine_no
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query.toLowerCase())
    })
  }

  return {
    handleFormulaSave,
    handleInterlockSave,
    handleParameterTypeChange,
    handleFormulaSelect,
    handleInterlockSelect,
    handleThresholdRemove,
    handleThresholdAdd,
    filterFormulas,
    filterInterlocks
  }
}