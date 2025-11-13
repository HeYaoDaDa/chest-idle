<script setup lang="ts">
import ItemModal from '@/components/modalBox/ItemModal.vue'
import ChestResultsModal from '@/components/modalBox/ChestResultsModal.vue'
import { useInventoryStore, type InventoryItem } from '@/stores/inventory'
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { slotConfigs, itemConfigMap } from '@/gameConfig'
import { useEquippedItemStore } from '@/stores/equippedItem'

const { t } = useI18n()
const playerStore = useInventoryStore()
const equippedItemStore = useEquippedItemStore()

// 统一选择状态：被选中的物品及其来源（inventory / equipped）
const selectedItemId = shallowRef<string | null>(null)
const selectedContext = shallowRef<'inventory' | 'equipped' | null>(null)
// 通过来源推导：若来自库存则获取 InventoryItem
const selectedInventoryItem = computed(() =>
  selectedContext.value === 'inventory' && selectedItemId.value
    ? playerStore.getInventoryItem(selectedItemId.value) ?? null
    : null
)

// 使用 store 提供的 equippedBySlot，避免重复计算
const equippedBySlot = computed(() => equippedItemStore.equippedBySlot)

// 为模板提供无空值的名称映射，避免索引 null 导致类型错误
const equippedItemNameBySlot = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const slot of slotConfigs) {
    const id = equippedBySlot.value[slot.id]
    map[slot.id] = id ? itemConfigMap[id].name : slot.name
  }
  return map
})

const selectedSlotId = computed(() => {
  if (selectedContext.value !== 'equipped' || !selectedItemId.value) return null
  for (const slotId in equippedBySlot.value) {
    if (equippedBySlot.value[slotId] === selectedItemId.value) return slotId
  }
  return null
})
// Modal 展示所需的当前 itemId
const currentItemId = computed(() => selectedItemId.value)
const chestOpenResults = shallowRef<{ itemId: string; amount: number }[] | null>(null)
const activeTab = shallowRef<'inventory' | 'equipment' | 'abilities'>('inventory')

// 计算属性
const maxChestAmount = computed(() => {
  return selectedInventoryItem.value?.count || 1
})
const slotList = computed(() => {
  return slotConfigs.map((slot) => {
    return { id: slot.id, name: slot.name }
  })
})

// 已装备物品映射已在上方 unified 结构中定义 equippedBySlot

// 装备槽点击 -> 打开装备查看
function openEquipmentModal(slotId: string, equipmentId: string): void {
  selectedItemId.value = equipmentId
  selectedContext.value = 'equipped'
}

function unequipAndClose(): void {
  if (selectedSlotId.value) {
    equippedItemStore.unequipSlot(selectedSlotId.value)
    closeItemModal()
  }
}

// 背包物品点击 -> 打开库存物品查看
function openInventoryModal(item: InventoryItem): void {
  selectedItemId.value = item.item.id
  selectedContext.value = 'inventory'
  chestOpenResults.value = null
}

function closeItemModal(): void {
  selectedItemId.value = null
  selectedContext.value = null
}

function equipAndClose(): void {
  if (selectedInventoryItem.value) {
    equippedItemStore.equipItem(selectedInventoryItem.value.item.id)
    closeItemModal()
  }
}

// 开箱函数
function openChestAndClose(amount?: number): void {
  if (selectedInventoryItem.value) {
    const amountToOpen = amount ?? 1
    if (amountToOpen >= 1 && amountToOpen <= maxChestAmount.value) {
      const results = playerStore.openChest(selectedInventoryItem.value, amountToOpen)
      chestOpenResults.value = results
      closeItemModal()
    }
  }
}

function closeChestResults(): void {
  chestOpenResults.value = null
}

// 辅助函数
function openSlotEquipment(slotId: string): void {
  const equipmentId = equippedBySlot.value[slotId]
  if (equipmentId) {
    openEquipmentModal(slotId, equipmentId)
  }
}
</script>

<template>
  <div id="mystuff-page">
    <div class="tabs-header">
      <button class="tab-button" :class="{ active: activeTab === 'inventory' }" @click="activeTab = 'inventory'">
        {{ t('ui.inventory') }}
      </button>
      <button class="tab-button" :class="{ active: activeTab === 'equipment' }" @click="activeTab = 'equipment'">
        {{ t('ui.equipment') }}
      </button>
      <button class="tab-button" :class="{ active: activeTab === 'abilities' }" @click="activeTab = 'abilities'">
        {{ t('ui.abilities') }}
      </button>
    </div>
    <div class="tabs-content">
      <div v-show="activeTab === 'inventory'" id="inventory" class="tab-panel">
        <div v-for="inventoryItem in playerStore.inventoryItems" :key="inventoryItem.item.id" class="inventory-item"
          @click="openInventoryModal(inventoryItem)">
          <div>{{ t(inventoryItem.item.name) }}</div>
          <div v-if="inventoryItem.count > 1" class="inventory-count">
            x{{ inventoryItem.count }}
          </div>
        </div>
      </div>
      <div v-show="activeTab === 'equipment'" id="equipment" class="tab-panel">
        <div v-for="slot in slotList" :key="slot.id" class="equipment-cell">
          <div v-if="equippedBySlot[slot.id]" class="equipment-item"
            @click="openSlotEquipment(slot.id)">
            <div>{{ t(equippedItemNameBySlot[slot.id]) }}</div>
          </div>
          <div v-else class="equipment-slot">
            <span>{{ t(slot.name) }}</span>
          </div>
        </div>
      </div>
      <div v-show="activeTab === 'abilities'" id="abilities" class="tab-panel">
        <!-- Abilities content here -->
      </div>
    </div>
  </div>

  <!-- Unified Item Modal -->
  <ItemModal :show="!!currentItemId" :itemId="currentItemId ?? ''" @close="closeItemModal"
    @unequip="unequipAndClose" @equip="equipAndClose" @open-chest="openChestAndClose" />

  <!-- Chest Open Results Modal -->
  <ChestResultsModal :show="!!chestOpenResults" :results="chestOpenResults" @close="closeChestResults" />
</template>

<style lang="scss" scoped>
@use '@/styles/shared-components';

#mystuff-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
