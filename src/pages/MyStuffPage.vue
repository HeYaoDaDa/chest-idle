<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue'
import { dataManager } from '@/models/global/DataManager'
import { inventory } from '@/models/global/InventoryManager'
import type { Equipment } from '@/models/item/Equipment'
import type { InventoryItem } from '@/models/inventory/InventoryItem'
import type { Slot } from '@/models/Slot'
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const selectedEquipment = shallowRef<{ slot: Slot; equipment: Equipment } | null>(null)
const selectedInventoryItem = shallowRef<InventoryItem | null>(null)
const chestOpenAmount = shallowRef<number>(1)
const chestOpenResults = shallowRef<{ itemName: string; amount: number }[] | null>(null)
const activeTab = shallowRef<'inventory' | 'equipment' | 'abilities'>('inventory')

const maxChestAmount = computed(() => {
  return selectedInventoryItem.value?.amount.value || 1
})

const isValidChestAmount = computed(() => {
  const amount = chestOpenAmount.value
  return amount >= 1 && amount <= maxChestAmount.value && Number.isInteger(amount)
})

function openEquipmentModal(slot: Slot, equipment: Equipment) {
  selectedEquipment.value = { slot, equipment }
}

function closeEquipmentModal() {
  selectedEquipment.value = null
}

function unequipAndClose() {
  if (selectedEquipment.value) {
    selectedEquipment.value.slot.unEquip()
    closeEquipmentModal()
  }
}

function openInventoryModal(item: InventoryItem) {
  selectedInventoryItem.value = item
  chestOpenAmount.value = 1
  chestOpenResults.value = null // 清空之前的开箱结果
}

function closeInventoryModal() {
  selectedInventoryItem.value = null
  // 不要在这里清空开箱结果，让结果模态框单独管理
}

function equipAndClose() {
  if (selectedInventoryItem.value) {
    selectedInventoryItem.value.equip()
    closeInventoryModal()
  }
}

function setMaxChestAmount() {
  chestOpenAmount.value = maxChestAmount.value
}

function openChestAndClose() {
  if (selectedInventoryItem.value && isValidChestAmount.value) {
    const chest = selectedInventoryItem.value
    const chestId = chest.item.id
    const results = new Map<string, number>()

    // 记录开箱前的库存
    const inventoryBefore = new Map<string, number>()
    inventory.inventoryItems.value.forEach((item) => {
      inventoryBefore.set(item.item.id, item.amount.value)
    })

    // 批量开箱
    for (let i = 0; i < chestOpenAmount.value; i++) {
      chest.openChest()
    }

    // 计算新增的物品（排除宝箱本身）
    inventory.inventoryItems.value.forEach((item) => {
      // 跳过宝箱本身
      if (item.item.id === chestId) return

      const beforeAmount = inventoryBefore.get(item.item.id) || 0
      const afterAmount = item.amount.value
      const gained = afterAmount - beforeAmount
      if (gained > 0) {
        results.set(item.item.name, gained)
      }
    })

    // 转换为显示格式
    const resultArray = Array.from(results.entries()).map(([itemName, amount]) => ({
      itemName,
      amount,
    }))

    // 设置开箱结果（即使是空数组也要显示）
    chestOpenResults.value = resultArray

    // 关闭库存模态框
    closeInventoryModal()
  }
}

function closeChestResults() {
  chestOpenResults.value = null
}
</script>

<template>
  <div id="mystuff-page">
    <div class="tabs-header">
      <button
        class="tab-button"
        :class="{ active: activeTab === 'inventory' }"
        @click="activeTab = 'inventory'"
      >
        {{ t('ui.inventory') }}
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'equipment' }"
        @click="activeTab = 'equipment'"
      >
        {{ t('ui.equipment') }}
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'abilities' }"
        @click="activeTab = 'abilities'"
      >
        {{ t('ui.abilities') }}
      </button>
    </div>
    <div class="tabs-content">
      <div v-show="activeTab === 'inventory'" id="inventory" class="tab-panel">
        <div
          v-for="inventoryItem in inventory.inventoryItems.value"
          :key="inventoryItem.item.id"
          class="inventory-item"
          @click="openInventoryModal(inventoryItem)"
        >
          <div>{{ t(inventoryItem.item.name) }}</div>
          <div v-if="inventoryItem.amount.value > 1" class="inventory-count">
            x{{ inventoryItem.amount.value }}
          </div>
        </div>
      </div>
      <div v-show="activeTab === 'equipment'" id="equipment" class="tab-panel">
        <div v-for="slot in dataManager.allSlot" :key="slot.id" class="equipment-cell">
          <div
            v-if="slot.equipment.value"
            class="equipment-item"
            @click="openEquipmentModal(slot, slot.equipment.value)"
          >
            <div>{{ t(slot.equipment.value.name) }}</div>
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
  <ModalBox v-if="selectedEquipment" @close="closeEquipmentModal">
    <div class="item-modal">
      <div class="item-modal-header">
        <h3 class="item-modal-title">{{ t(selectedEquipment.equipment.name) }}</h3>
        <span class="item-modal-type">{{ t('ui.type') }}: {{ t(selectedEquipment.slot.name) }}</span>
      </div>

      <div class="item-modal-content">
        <p class="item-modal-description">{{ t(selectedEquipment.equipment.description) }}</p>

        <div v-if="selectedEquipment.equipment.effects.length > 0" class="item-modal-section">
          <h4 class="item-modal-section-title">{{ t('ui.effects') }}</h4>
          <div class="item-modal-effects">
            <div v-for="(effect, index) in selectedEquipment.equipment.effects" :key="index" class="item-modal-effect">
              <span class="effect-state">{{ t(`state.${effect.state}.name`) }}</span>
              <span class="effect-value">
                {{ effect.type === 'flat' ? '+' : effect.type === 'percentage' ? '+' : '-'
                }}{{ effect.value
                }}{{
                  effect.type === 'percentage' || effect.type === 'inversePercentage' ? '%' : ''
                }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="item-modal-footer">
        <div class="zone-action-buttons">
          <button type="button" class="zone-button ghost" @click="unequipAndClose">
            {{ t('ui.unequip') }}
          </button>
        </div>
      </div>
    </div>
  </ModalBox>

  <!-- Inventory Modal -->
  <ModalBox v-if="selectedInventoryItem" @close="closeInventoryModal">
    <div class="item-modal">
      <div class="item-modal-header">
        <h3 class="item-modal-title">{{ t(selectedInventoryItem.item.name) }}</h3>
        <span class="item-modal-quantity">{{ t('ui.quantity') }}: {{ selectedInventoryItem.amount.value }}</span>
      </div>

      <div class="item-modal-content">
        <p class="item-modal-description">{{ t(selectedInventoryItem.item.description) }}</p>

        <div v-if="selectedInventoryItem.item.isEquipment()" class="item-modal-section">
          <div class="item-modal-info-row">
            <span class="info-label">{{ t('ui.slot') }}</span>
            <span class="info-value">{{ t(selectedInventoryItem.item.slot.name) }}</span>
          </div>
        </div>

        <div v-if="
          selectedInventoryItem.item.isEquipment() &&
          selectedInventoryItem.item.effects.length > 0
        " class="item-modal-section">
          <h4 class="item-modal-section-title">{{ t('ui.effects') }}</h4>
          <div class="item-modal-effects">
            <div v-for="(effect, index) in selectedInventoryItem.item.effects" :key="index" class="item-modal-effect">
              <span class="effect-state">{{ t(`state.${effect.state}.name`) }}</span>
              <span class="effect-value">
                {{ effect.type === 'flat' ? '+' : effect.type === 'percentage' ? '+' : '-'
                }}{{ effect.value
                }}{{
                  effect.type === 'percentage' || effect.type === 'inversePercentage' ? '%' : ''
                }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="item-modal-footer">
        <div class="zone-action-buttons">
          <button v-if="selectedInventoryItem.item.isEquipment()" type="button" class="zone-button primary"
            @click="equipAndClose">
            {{ t('ui.equip') }}
          </button>
          <div v-if="selectedInventoryItem.item.isChest()" class="chest-controls">
            <div v-if="maxChestAmount > 1" class="chest-amount-controls">
              <input v-model.number="chestOpenAmount" type="number" :min="1" :max="maxChestAmount"
                class="chest-amount-input" :placeholder="String(maxChestAmount)" />
              <button type="button" class="zone-button ghost max-button" @click="setMaxChestAmount">
                Max
              </button>
            </div>
            <button type="button" class="zone-button primary" @click="openChestAndClose"
              :disabled="!isValidChestAmount">
              {{ t('ui.open') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </ModalBox>

  <!-- Chest Open Results Modal -->
  <ModalBox v-if="chestOpenResults" @close="closeChestResults">
    <div class="chest-results-modal">
      <div class="chest-results-header">
        <h3 class="chest-results-title">{{ t('ui.chestOpenResults') }}</h3>
      </div>

      <div class="chest-results-content">
        <div v-if="chestOpenResults.length > 0" class="chest-results-list">
          <div v-for="result in chestOpenResults" :key="result.itemName" class="chest-result-item">
            <span class="result-item-name">{{ t(result.itemName) }}</span>
            <span class="result-item-amount">×{{ result.amount }}</span>
          </div>
        </div>
        <div v-else class="chest-results-empty">
          {{ t('ui.noItemsObtained') }}
        </div>
      </div>

      <div class="chest-results-footer">
        <div class="zone-action-buttons">
          <button type="button" class="zone-button primary" @click="closeChestResults">
            {{ t('ui.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss" scoped>
#mystuff-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  gap: 2px;
  padding: 2px 2px 0 2px;
  background: rgba(248, 250, 252, 0.5);
  border-bottom: 2px solid rgba(148, 163, 184, 0.2);
}

.tab-button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  user-select: none;

  &:hover:not(.active) {
    background: rgba(226, 232, 240, 0.5);
    color: #475569;
  }

  &.active {
    background: rgba(255, 255, 255, 0.95);
    color: #2563eb;
    box-shadow: 0 -2px 8px rgba(37, 99, 235, 0.1);
  }
}

.tabs-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-panel {
  height: 100%;
  overflow-y: auto;
  padding: 2px;
}

#inventory {
  display: grid;
  grid-template-columns: repeat(auto-fill, 64px);
  gap: 6px;
  align-content: start;

  .inventory-item {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    padding: 6px;
    font-weight: 600;
    font-size: 12px;
    color: #1e293b;
    cursor: pointer;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;
    box-sizing: border-box;
    text-align: center;
    line-height: 1.2;
    user-select: none;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.15);
      border-color: rgba(37, 99, 235, 0.35);
    }
  }

  .inventory-count {
    font-size: 10px;
    font-weight: 700;
    color: #2563eb;
  }
}

#equipment {
  display: grid;
  grid-template-columns: repeat(auto-fill, 64px);
  gap: 6px;
  align-content: start;

  .equipment-cell {
    display: flex;
    width: 64px;
    height: 64px;
  }

  .equipment-item,
  .equipment-slot {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.08);
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 6px;
    font-weight: 600;
    font-size: 12px;
    color: #1e293b;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease,
      background 0.18s ease;
    cursor: pointer;
    box-sizing: border-box;
    line-height: 1.2;
    user-select: none;
  }

  .equipment-slot {
    border-style: dashed;
    opacity: 0.6;
  }

  .equipment-item {
    border-style: solid;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.15);
      border-color: rgba(37, 99, 235, 0.35);
    }
  }
}

#abilities {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #94a3b8;
  font-style: italic;
}

.item-modal {
  min-width: min(420px, 90vw);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(37, 99, 235, 0.12);
}

.item-modal-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.item-modal-type,
.item-modal-quantity {
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.item-modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-modal-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
}

.item-modal-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-modal-section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.item-modal-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 6px;
}

.info-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.item-modal-effects {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-modal-effect {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%);
  border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 6px;
}

.effect-state {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.effect-value {
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
}

.item-modal-footer {
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.zone-action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.chest-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chest-amount-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chest-amount-input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  color: #1f2937;
}

.chest-amount-input:focus {
  outline: none;
  border-color: rgba(37, 99, 235, 0.5);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.max-button {
  padding: 6px 12px;
  font-size: 12px;
}

.zone-button {
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.zone-button.primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
}

.zone-button.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.zone-button.ghost {
  background: #e2e8f0;
  color: #1f2937;
}

.zone-button.ghost:hover {
  background: #cbd5e1;
  transform: translateY(-1px);
}

.chest-results-modal {
  min-width: min(400px, 90vw);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chest-results-header {
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(37, 99, 235, 0.12);
}

.chest-results-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.chest-results-content {
  max-height: 300px;
  overflow-y: auto;
}

.chest-results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chest-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(37, 99, 235, 0.05);
  border-radius: 8px;
  border-left: 3px solid rgba(37, 99, 235, 0.3);
}

.result-item-name {
  font-weight: 600;
  color: #1f2937;
}

.result-item-amount {
  font-weight: 700;
  color: #2563eb;
}

.chest-results-empty {
  text-align: center;
  padding: 24px;
  color: #64748b;
  font-style: italic;
}

.chest-results-footer {
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}
</style>
