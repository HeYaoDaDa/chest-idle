<script setup lang="ts">
import ActionQueue from '@/components/misc/ActionQueue.vue'
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
    inventory.inventoryItems.value.forEach(item => {
      inventoryBefore.set(item.item.id, item.amount.value)
    })

    // 批量开箱
    for (let i = 0; i < chestOpenAmount.value; i++) {
      chest.openChest()
    }

    // 计算新增的物品（排除宝箱本身）
    inventory.inventoryItems.value.forEach(item => {
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
      amount
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
  <div id="game-page-root">
    <div id="game-page-layout-container">
      <div id="header">
        <div id="header-title-action">
          <div>
            <h1>{{ t('gameName') }}</h1>
          </div>
          <ActionQueue />
        </div>
      </div>
      <div id="sidebar">
        <router-link v-for="skill in dataManager.allSkill" :key="skill.id" :to="`/game/${skill.id}`"
          active-class="active-link">
          <div>{{ t(skill.name) }} {{ t('ui.level', { level: skill.level.value }) }}</div>
          <div style="width: 100%">
            <div :style="{
              width: skill.upgradeProgress.value * 100 + '%',
              height: '2px',
              backgroundColor: 'black',
            }"></div>
          </div>
        </router-link>
        <router-link :to="`/game/states`" active-class="active-link">
          <div>States</div>
          <div style="width: 100%">
            <div></div>
          </div>
        </router-link>
      </div>
      <div id="content">
        <RouterView />
      </div>
      <div id="equipment">
        <div v-for="slot in dataManager.allSlot" :key="slot.id" class="equipment-cell">
          <div v-if="slot.equipment.value" class="equipment-item"
            @click="openEquipmentModal(slot, slot.equipment.value)">
            <div>{{ t(slot.equipment.value.name) }}</div>
          </div>
          <div v-else class="equipment-slot">
            <span>{{ t(slot.name) }}</span>
          </div>
        </div>
      </div>
      <div id="abilities"></div>
      <div id="inventory">
        <div v-for="inventoryItem in inventory.inventoryItems.value" :key="inventoryItem.item.id" class="inventory-item"
          @click="openInventoryModal(inventoryItem)">
          <div>{{ t(inventoryItem.item.name) }}</div>
          <div v-if="inventoryItem.amount.value > 1" class="inventory-count">
            x{{ inventoryItem.amount.value }}
          </div>
        </div>
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
                {{ effect.type === 'flat' ? '+' : effect.type === 'percentage' ? '+' : '-' }}{{ effect.value }}{{
                  effect.type === 'percentage' || effect.type === 'inversePercentage' ? '%' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

            <div class="item-modal-footer">
        <div class="zone-action-buttons">
          <button
            type="button"
            class="zone-button ghost"
            @click="unequipAndClose"
          >
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

        <div v-if="selectedInventoryItem.item.isEquipment() && selectedInventoryItem.item.effects.length > 0"
          class="item-modal-section">
          <h4 class="item-modal-section-title">{{ t('ui.effects') }}</h4>
          <div class="item-modal-effects">
            <div v-for="(effect, index) in selectedInventoryItem.item.effects" :key="index" class="item-modal-effect">
              <span class="effect-state">{{ t(`state.${effect.state}.name`) }}</span>
              <span class="effect-value">
                {{ effect.type === 'flat' ? '+' : effect.type === 'percentage' ? '+' : '-' }}{{ effect.value }}{{
                  effect.type === 'percentage' || effect.type === 'inversePercentage' ? '%' : '' }}
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
              <input
                v-model.number="chestOpenAmount"
                type="number"
                :min="1"
                :max="maxChestAmount"
                class="chest-amount-input"
                :placeholder="String(maxChestAmount)"
              />
              <button
                type="button"
                class="zone-button ghost max-button"
                @click="setMaxChestAmount"
              >
                Max
              </button>
            </div>
            <button
              type="button"
              class="zone-button primary"
              @click="openChestAndClose"
              :disabled="!isValidChestAmount"
            >
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
          <div
            v-for="result in chestOpenResults"
            :key="result.itemName"
            class="chest-result-item"
          >
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
          <button
            type="button"
            class="zone-button primary"
            @click="closeChestResults"
          >
            {{ t('ui.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss">
#game-page-root {
  height: 100%;
  padding: 16px;
  box-sizing: border-box;

  #game-page-layout-container {
    height: 100%;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr) 280px 280px;
    grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;

    >div {
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 10px;
      padding: 12px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }

    #header {
      grid-column: 1 / 5;
      grid-row: 1 / 2;

      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;

      h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: #0f172a;
      }

      #header-title-action {
        display: flex;
        flex-flow: row nowrap;
        gap: 20px;
        align-items: center;
      }
    }

    #sidebar {
      grid-column: 1 / 2;
      grid-row: 2 / 4;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      overflow-y: auto;

      a {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        width: 100%;
        border-radius: 8px;
        background: rgba(248, 250, 252, 0.72);
        font-weight: 600;
        color: #1e293b;
        transition:
          transform 0.15s ease,
          box-shadow 0.15s ease,
          background 0.15s ease;
        cursor: pointer;
        user-select: none;

        &:hover:not(.active-link) {
          background: rgba(226, 232, 240, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
        }

        &.active-link {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #ffffff;
          box-shadow: 0 12px 22px rgba(37, 99, 235, 0.28);
        }
      }
    }

    #content {
      grid-column: 2 / 3;
      grid-row: 2 / 4;
      padding: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      >* {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 16px;
      }
    }

    #equipment {
      grid-column: 3 / 4;
      grid-row: 2 / 3;
      display: grid;
      grid-template-columns: repeat(auto-fill, 120px);
      gap: 8px;
      padding: 12px;
      align-content: start;
      overflow-y: auto;

      .equipment-cell {
        display: flex;
        width: 120px;
        height: 120px;
      }

      .equipment-item,
      .equipment-slot {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        background: rgba(248, 250, 252, 0.9);
        border: 1px dashed rgba(148, 163, 184, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 8px;
        font-weight: 600;
        color: #1e293b;
        transition:
          transform 0.15s ease,
          box-shadow 0.15s ease,
          background 0.15s ease;
        cursor: pointer;
        box-sizing: border-box;
      }

      .equipment-item {
        border-style: solid;
        background: rgba(226, 232, 240, 0.9);

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 20px rgba(15, 23, 42, 0.12);
        }
      }
    }

    #abilities {
      grid-column: 4 / 5;
      grid-row: 2 / 3;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 10px;
      background: rgba(248, 250, 252, 0.72);
      color: #94a3b8;
      font-style: italic;
    }

    #inventory {
      grid-column: 3 / 5;
      grid-row: 3 / 4;
      display: grid;
      grid-template-columns: repeat(auto-fill, 120px);
      gap: 8px;
      padding: 12px;
      align-content: start;
      overflow: auto;

      .inventory-item {
        width: 120px;
        height: 120px;
        border-radius: 8px;
        background: rgba(248, 250, 252, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.3);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 4px;
        padding: 8px;
        font-weight: 600;
        color: #1e293b;
        cursor: pointer;
        transition:
          transform 0.15s ease,
          box-shadow 0.15s ease;
        box-sizing: border-box;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 20px rgba(15, 23, 42, 0.12);
        }
      }

      .inventory-count {
        font-size: 12px;
        font-weight: 700;
        color: #2563eb;
      }
    }
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

  /* Chest Results Modal Styles */
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
}

@media (max-width: 1280px) {
  #game-page-root {
    padding: 12px;

    #game-page-layout-container {
      grid-template-columns: 220px 1fr;
      grid-template-rows: auto repeat(3, minmax(0, 1fr));

      #header {
        grid-column: 1 / -1;
      }

      #sidebar {
        grid-column: 1 / 2;
        grid-row: 2 / 5;
      }

      #content {
        grid-column: 2 / 3;
        grid-row: 2 / 3;
      }

      #equipment {
        grid-column: 2 / 3;
        grid-row: 3 / 4;
      }

      #abilities {
        grid-column: 2 / 3;
        grid-row: 4 / 5;
      }

      #inventory {
        grid-column: 1 / 3;
        grid-row: 5 / 6;
        max-height: 280px;
      }
    }
  }
}

@media (max-width: 960px) {
  #game-page-root {
    padding: 8px;

    #game-page-layout-container {
      display: flex;
      flex-direction: column;

      >div {
        padding: 12px;
      }

      #sidebar {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: stretch;

        a {
          flex: 1 1 140px;
        }
      }

      #content>* {
        padding: 14px;
      }

      #inventory {
        max-height: none;
      }
    }
  }
}
</style>
