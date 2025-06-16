import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PlotStyleTemplate } from '@/types/plot-style-template'

interface PlotStyleTemplateState {
  templates: PlotStyleTemplate[]
  
  // Actions
  addTemplate: (template: Omit<PlotStyleTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTemplate: (id: string, template: Partial<PlotStyleTemplate>) => void
  deleteTemplate: (id: string) => void
  getTemplate: (id: string) => PlotStyleTemplate | undefined
  duplicateTemplate: (id: string, newName: string) => void
}

export const usePlotStyleTemplateStore = create<PlotStyleTemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
      
      addTemplate: (template) => {
        const newTemplate: PlotStyleTemplate = {
          ...template,
          id: `template_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        set((state) => ({
          templates: [...state.templates, newTemplate]
        }))
      },
      
      updateTemplate: (id, template) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? { ...t, ...template, updatedAt: new Date().toISOString() }
              : t
          )
        }))
      },
      
      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id)
        }))
      },
      
      getTemplate: (id) => {
        return get().templates.find((t) => t.id === id)
      },
      
      duplicateTemplate: (id, newName) => {
        const original = get().getTemplate(id)
        if (!original) return
        
        const duplicate: PlotStyleTemplate = {
          ...original,
          id: `template_${Date.now()}`,
          name: newName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        set((state) => ({
          templates: [...state.templates, duplicate]
        }))
      }
    }),
    {
      name: 'plot-style-templates',
      version: 1,
    }
  )
)