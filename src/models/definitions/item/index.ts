import type { ChestDefinition } from './ChestDefinition'
import type { EquipmentDefinition } from './EquipmentDefinition'
import type { ResourceDefinition } from './ResourceDefinition'

export type ItemDefinition = ResourceDefinition | ChestDefinition | EquipmentDefinition
