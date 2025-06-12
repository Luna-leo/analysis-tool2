import { SearchCondition } from '@/types'

export interface PredefinedCondition {
  id: string
  name: string
  description: string
  expression: string
  conditions: SearchCondition[]
}

export const predefinedConditions: PredefinedCondition[] = [
  {
    id: 'high_temp',
    name: 'High Temperature Alert',
    description: 'Temperature exceeds safe operating range',
    expression: 'temperature > 80',
    conditions: [
      { id: 'cond_temp', type: 'condition' as const, parameter: 'temperature', operator: 'gt' as const, value: '80' }
    ]
  },
  {
    id: 'pressure_anomaly',
    name: 'Pressure Anomaly',
    description: 'Pressure outside normal operating range',
    expression: 'pressure > 15 OR pressure < 5',
    conditions: [
      { 
        id: 'cond_pressure_group', 
        type: 'group' as const,
        conditions: [
          { id: 'cond_pressure_high', type: 'condition' as const, parameter: 'pressure', operator: 'gt' as const, value: '15' },
          { id: 'cond_pressure_low', type: 'condition' as const, parameter: 'pressure', operator: 'lt' as const, value: '5', logicalOperator: 'OR' as const }
        ]
      }
    ]
  },
  {
    id: 'critical_combination',
    name: 'Critical Operating Condition',
    description: 'High temperature with abnormal pressure or flow',
    expression: 'temperature > 85 AND (pressure > 12 OR flow < 30)',
    conditions: [
      { id: 'cond_temp_critical', type: 'condition' as const, parameter: 'temperature', operator: 'gt' as const, value: '85' },
      { 
        id: 'cond_critical_group', 
        type: 'group' as const,
        conditions: [
          { id: 'cond_pressure_critical', type: 'condition' as const, parameter: 'pressure', operator: 'gt' as const, value: '12' },
          { id: 'cond_flow_critical', type: 'condition' as const, parameter: 'flow', operator: 'lt' as const, value: '30', logicalOperator: 'OR' as const }
        ],
        logicalOperator: 'AND' as const
      }
    ]
  },
  {
    id: 'pump_operation',
    name: 'Pump Operation Status',
    description: 'Monitor pump switch and valve status',
    expression: 'pump_switch is ON AND valve_01_status is ON',
    conditions: [
      { id: 'cond_pump_on', type: 'condition' as const, parameter: 'pump_switch', operator: 'isOn' as const, value: undefined },
      { id: 'cond_valve_on', type: 'condition' as const, parameter: 'valve_01_status', operator: 'isOn' as const, value: undefined, logicalOperator: 'AND' as const }
    ]
  },
  {
    id: 'equipment_startup',
    name: 'Equipment Startup Detection',
    description: 'Detect when motor starts and valve opens',
    expression: 'motor_01 switched ON OR valve_02_status switched ON',
    conditions: [
      { 
        id: 'cond_startup_group', 
        type: 'group' as const,
        conditions: [
          { id: 'cond_motor_start', type: 'condition' as const, parameter: 'motor_01', operator: 'switchedOn' as const, value: undefined },
          { id: 'cond_valve_open', type: 'condition' as const, parameter: 'valve_02_status', operator: 'switchedOn' as const, value: undefined, logicalOperator: 'OR' as const }
        ]
      }
    ]
  },
  {
    id: 'efficiency_drop',
    name: 'Efficiency Drop Detection',
    description: 'Low flow with normal or high speed indicates efficiency issues',
    expression: 'flow < 40 AND speed >= 50',
    conditions: [
      { id: 'cond_flow_low', type: 'condition' as const, parameter: 'flow', operator: 'lt' as const, value: '40' },
      { id: 'cond_speed_normal', type: 'condition' as const, parameter: 'speed', operator: 'gte' as const, value: '50', logicalOperator: 'AND' as const }
    ]
  },
  {
    id: 'startup_sequence',
    name: 'Startup Sequence Detection',
    description: 'Conditions indicating machine startup phase',
    expression: 'temperature < 50 AND pressure < 8 AND speed > 0',
    conditions: [
      { id: 'cond_temp_startup', type: 'condition' as const, parameter: 'temperature', operator: 'lt' as const, value: '50' },
      { id: 'cond_pressure_startup', type: 'condition' as const, parameter: 'pressure', operator: 'lt' as const, value: '8', logicalOperator: 'AND' as const },
      { id: 'cond_speed_startup', type: 'condition' as const, parameter: 'speed', operator: 'gt' as const, value: '0', logicalOperator: 'AND' as const }
    ]
  }
]