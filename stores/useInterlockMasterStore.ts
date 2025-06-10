import { create } from "zustand"
import { InterlockMaster } from "@/types"
import { mockInterlockMaster } from "@/data/interlockMaster"

interface InterlockMasterStore {
  interlocks: InterlockMaster[]
  setInterlocks: (interlocks: InterlockMaster[]) => void
  addInterlock: (interlock: InterlockMaster) => void
  updateInterlock: (interlock: InterlockMaster) => void
  deleteInterlock: (interlockId: string) => void
}

export const useInterlockMasterStore = create<InterlockMasterStore>((set) => ({
  interlocks: mockInterlockMaster,
  setInterlocks: (interlocks) => set({ interlocks }),
  addInterlock: (interlock) => set((state) => ({ interlocks: [...state.interlocks, interlock] })),
  updateInterlock: (interlock) => set((state) => ({
    interlocks: state.interlocks.map((i) => (i.id === interlock.id ? interlock : i))
  })),
  deleteInterlock: (interlockId) => set((state) => ({
    interlocks: state.interlocks.filter((i) => i.id !== interlockId)
  })),
}))