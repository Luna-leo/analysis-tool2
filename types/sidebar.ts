import { ActiveView } from "./index"

export type SystemNodeConfig = {
  id: string
  name: string
  type: string
  icon: React.ComponentType<{ className?: string }>
  viewType: ActiveView
}

export type ActivityBarItem = {
  view: ActiveView
  icon: React.ComponentType<{ className?: string }>
}