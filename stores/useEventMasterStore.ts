import { create } from "zustand"
import { EventMaster } from "@/types"
import { mockEventMasterData } from "@/data/eventMaster"
import { formatDateToISO } from "@/utils/dateUtils"

interface EventMasterStore {
  events: EventMaster[]
  searchQuery: string
  isLoading: boolean
  
  // Actions
  setEvents: (events: EventMaster[]) => void
  addEvent: (event: EventMaster) => void
  updateEvent: (event: EventMaster) => void
  deleteEvent: (eventId: string) => void
  duplicateEvent: (id: string, newName: string) => void
  setSearchQuery: (query: string) => void
  setIsLoading: (loading: boolean) => void
  
  // Computed
  getFilteredEvents: () => EventMaster[]
  getEventById: (id: string) => EventMaster | undefined
}

export const useEventMasterStore = create<EventMasterStore>((set, get) => ({
  events: mockEventMasterData,
  searchQuery: '',
  isLoading: false,
  
  setEvents: (events) => set({ events }),
  
  addEvent: (event) => {
    const newEvent: EventMaster = {
      ...event,
      id: event.id || `event_${Date.now()}`,
      createdAt: event.createdAt || formatDateToISO(new Date()),
      updatedAt: formatDateToISO(new Date())
    }
    set((state) => ({ events: [...state.events, newEvent] }))
  },
  
  updateEvent: (event) => {
    set((state) => ({
      events: state.events.map((e) => 
        e.id === event.id 
          ? { ...event, updatedAt: formatDateToISO(new Date()) }
          : e
      )
    }))
  },
  
  deleteEvent: (eventId) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId)
    }))
  },
  
  duplicateEvent: (id, newName) => {
    const state = get()
    const original = state.events.find(e => e.id === id)
    if (!original) return
    
    const duplicate: EventMaster = {
      ...original,
      id: `event_${Date.now()}`,
      name: newName,
      createdAt: formatDateToISO(new Date()),
      updatedAt: formatDateToISO(new Date())
    }
    
    set((state) => ({
      events: [...state.events, duplicate]
    }))
  },
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  getEventById: (id) => {
    const state = get()
    return state.events.find(event => event.id === id)
  },
  
  getFilteredEvents: () => {
    const state = get()
    const query = state.searchQuery.toLowerCase()
    
    if (!query) return state.events
    
    return state.events.filter(event => 
      event.name?.toString().toLowerCase().includes(query) ||
      event.plant?.toString().toLowerCase().includes(query) ||
      event.unit?.toString().toLowerCase().includes(query) ||
      event.description?.toString().toLowerCase().includes(query) ||
      event.tag?.toString().toLowerCase().includes(query)
    )
  }
}))