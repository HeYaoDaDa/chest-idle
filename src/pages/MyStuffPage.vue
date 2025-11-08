<script setup lang="ts">
import ItemModal from '@/components/modalBox/ItemModal.vue'
import ChestResultsModal from '@/components/modalBox/ChestResultsModal.vue'
import type { Item } from '@/models/item'
import type { InventoryItem } from '@/models/InventoryItem'
import type { Slot } from '@/models/Slot'
import { useGameConfigStore } from '@/stores/gameConfig'
import { usePlayerStore } from '@/stores/player'
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const gameConfigStore = useGameConfigStore()
const playerStore = usePlayerStore()

// 状态管理
const selectedEquipment = shallowRef<{ slot: Slot; equipment: Item } | null>(null)
const selectedInventoryItem = shallowRef<InventoryItem | null>(null)
const chestOpenResults = shallowRef<{ itemName: string; amount: number }[] | null>(null)
const activeTab = shallowRef<'inventory' | 'equipment' | 'abilities'>('inventory')

// 计算属性
const maxChestAmount = computed(() => {
  return selectedInventoryItem.value?.quantity || 1
})

// 装备模态框函数
function openEquipmentModal(slot: Slot, equipment: Item): void {
  selectedEquipment.value = { slot, equipment }
}

function closeEquipmentModal(): void {
  selectedEquipment.value = null
}

function unequipAndClose(): void {
  if (selectedEquipment.value) {
    playerStore.unequipSlot(selectedEquipment.value.slot.id)
    closeEquipmentModal()
  }
}

// 背包物品模态框函数
function openInventoryModal(item: InventoryItem): void {
  selectedInventoryItem.value = item
  chestOpenResults.value = null // 清空之前的开箱结果
}

function closeInventoryModal(): void {
  selectedInventoryItem.value = null
}

function equipAndClose(): void {
  if (selectedInventoryItem.value) {
    playerStore.equipItem(selectedInventoryItem.value)
    closeInventoryModal()
  }
}

// 开箱函数
function openChestAndClose(amount?: number): void {
  if (selectedInventoryItem.value) {
    const amountToOpen = amount ?? 1
    if (amountToOpen >= 1 && amountToOpen <= maxChestAmount.value) {
      const results = playerStore.openChest(selectedInventoryItem.value, amountToOpen)
      chestOpenResults.value = results
      closeInventoryModal()
    }
  }
}

function closeChestResults(): void {
  chestOpenResults.value = null
}

// 辅助函数
function openSlotEquipment(slot: Slot): void {
  const equipment = playerStore.getEquippedItem(slot.id)
  if (equipment) {
    openEquipmentModal(slot, equipment)
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
          <div v-if="inventoryItem.quantity > 1" class="inventory-count">
            x{{ inventoryItem.quantity }}
          </div>
        </div>
      </div>
      <div v-show="activeTab === 'equipment'" id="equipment" class="tab-panel">
        <div v-for="slot in gameConfigStore.allSlots" :key="slot.id" class="equipment-cell">
          <div v-if="playerStore.getEquippedItem(slot.id)" class="equipment-item"
            @click="openSlotEquipment(slot as unknown as Slot)">
            <div>{{ t(playerStore.getEquippedItem(slot.id)!.name) }}</div>
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

  <!-- Equipment Modal -->
  <ItemModal :show="!!selectedEquipment" :equipment="selectedEquipment?.equipment"
    :equipment-slot="selectedEquipment?.slot" @close="closeEquipmentModal" @unequip="unequipAndClose" />

  <!-- Inventory Modal -->
  <ItemModal :show="!!selectedInventoryItem" :inventory-item="selectedInventoryItem ?? undefined"
    @close="closeInventoryModal" @equip="equipAndClose" @open-chest="openChestAndClose" />

  <!-- Chest Open Results Modal -->
  <ChestResultsModal :show="!!chestOpenResults" :results="chestOpenResults" @close="closeChestResults" />
</template>

<style lang="scss" scoped>
@use '@/styles/shared-components';

#my-stuff-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
