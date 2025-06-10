import { create } from "zustand"
import { EventMaster } from "@/types"
import { mockEventMasterData } from "@/data/eventMaster"

interface EventMasterStore {
  events: EventMaster[]
  searchQuery: string
  setEvents: (events: EventMaster[]) => void
  addEvent: (event: EventMaster) => void
  updateEvent: (event: EventMaster) => void
  deleteEvent: (eventId: string) => void
  setSearchQuery: (query: string) => void
}

export const useEventMasterStore = create<EventMasterStore>((set) => ({
  events: mockEventMasterData,
  searchQuery: '',
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateEvent: (event) => set((state) => ({
    events: state.events.map((e) => (e.id === event.id ? event : e))
  })),
  deleteEvent: (eventId) => set((state) => ({
    events: state.events.filter((e) => e.id !== eventId)
  })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}))