<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue'
import { dataManager } from '@/models/global/DataManager'
import { inventory } from '@/models/global/InventoryManager'
import { useI18n } from 'vue-i18n'
import { useEquipmentAndInventory } from '@/composables/useEquipmentAndInventory'

const { t } = useI18n()

// 使用通用 Composable
const {
  selectedEquipment,
  selectedInventoryItem,
  chestOpenAmount,
  chestOpenResults,
  activeTab,
  maxChestAmount,
  isValidChestAmount,
  openEquipmentModal,
  closeEquipmentModal,
  unequipAndClose,
  openInventoryModal,
  closeInventoryModal,
  equipAndClose,
  setMaxChestAmount,
  openChestAndClose,
  closeChestResults,
} = useEquipmentAndInventory()
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
@use '@/styles/variables' as *;
@use '@/styles/shared-components';

#mystuff-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
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

.item-modal-footer {
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}
</style>
