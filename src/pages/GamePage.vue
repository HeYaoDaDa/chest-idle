<script setup lang="ts">
import ActionQueue from '@/components/misc/ActionQueue.vue'
import ModalBox from '@/components/misc/ModalBox.vue'
import { dataManager } from '@/models/global/DataManager'
import { inventory } from '@/models/global/InventoryManager'
import { shallowRef, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEquipmentAndInventory } from '@/composables/useEquipmentAndInventory'

const { t } = useI18n()

// 使用通用 Composable 获取装备和背包相关功能
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

// GamePage 特定的状态
const sidebarExpanded = shallowRef(false)

// ============ 拖拽调整宽度功能 ============
const tabsWidth = shallowRef(360)
const isDraggingTabs = shallowRef(false)
let startX = 0
let initialWidth = 0
const parentElement = shallowRef<HTMLElement | undefined>(undefined)

// 宽度约束
const minTabsWidth = 280
const maxTabsWidthPercentage = 0.5

onMounted(() => {
  // 从 localStorage 恢复宽度
  const savedTabsWidth = localStorage.getItem('tabsWidth')
  if (savedTabsWidth) {
    tabsWidth.value = parseInt(savedTabsWidth)
  }

  // 获取父容器引用
  const container = document.getElementById('game-page-layout-container')
  if (container) {
    parentElement.value = container
  }
})

function startDragTabs(e: MouseEvent) {
  isDraggingTabs.value = true
  startX = e.clientX
  initialWidth = tabsWidth.value

  document.addEventListener('mousemove', dragTabs)
  document.addEventListener('mouseup', stopDragTabs)
  document.body.classList.add('dragging')
}

function dragTabs(e: MouseEvent) {
  if (!isDraggingTabs.value) return

  const deltaX = e.clientX - startX
  let newWidth = initialWidth - deltaX

  newWidth = Math.max(newWidth, minTabsWidth)

  if (parentElement.value && 'offsetWidth' in parentElement.value) {
    newWidth = Math.min(newWidth, parentElement.value.offsetWidth * maxTabsWidthPercentage)
  }

  tabsWidth.value = newWidth
}

function stopDragTabs() {
  isDraggingTabs.value = false
  document.removeEventListener('mousemove', dragTabs)
  document.removeEventListener('mouseup', stopDragTabs)
  document.body.classList.remove('dragging')

  // 保存宽度到 localStorage
  localStorage.setItem('tabsWidth', tabsWidth.value.toString())
}

function toggleSidebar() {
  sidebarExpanded.value = !sidebarExpanded.value
}

function closeSidebar() {
  sidebarExpanded.value = false
}
</script>

<template>
  <div id="game-page-root">
    <div v-if="sidebarExpanded" class="sidebar-mask" @click="closeSidebar"></div>

        <div
      id="game-page-layout-container"
      :class="{ 'sidebar-expanded': sidebarExpanded }"
      :style="{
        '--tabs-width': tabsWidth + 'px'
      }"
    >
      <div id="header">
        <div id="header-title-action">
          <div class="header-title">
            <h1>{{ t('gameName') }}</h1>
          </div>
          <ActionQueue />
        </div>
      </div>
      <div id="sidebar" :class="{ expanded: sidebarExpanded }">
        <div class="mobile-sidebar-controls">
          <a class="sidebar-control-link" @click="toggleSidebar">
            <div class="skill-name">
              <span v-if="!sidebarExpanded">☰</span>
              <span v-else>✕</span>
            </div>
          </a>
          <router-link class="sidebar-control-link" :to="`/game/mystuff`" active-class="active-link" @click="closeSidebar">
            <div class="skill-name">{{ t('ui.myStuff') }}</div>
          </router-link>
        </div>
        <router-link
          v-for="skill in dataManager.allSkill"
          :key="skill.id"
          :to="`/game/${skill.id}`"
          active-class="active-link"
          @click="closeSidebar"
        >
          <div class="skill-name">
            <span class="name-text">{{ t(skill.name) }}</span>
            <span class="level-text">{{ t('ui.level', { level: skill.level.value }) }}</span>
          </div>
          <div class="skill-progress-wrapper">
            <div
              class="skill-progress-bar"
              :style="{
                width: skill.upgradeProgress.value * 100 + '%',
              }"
            ></div>
          </div>
        </router-link>
        <router-link :to="`/game/states`" active-class="active-link" @click="closeSidebar">
          <div class="skill-name">States</div>
        </router-link>
      </div>
      <div id="content">
        <RouterView />
      </div>
      <div id="tabs-container" ref="tabs-container" :style="{ width: tabsWidth + 'px' }">
        <div class="drag-handle drag-handle-left" @mousedown="startDragTabs">
          <div class="drag-indicator"></div>
        </div>
        <div class="tabs-wrapper">
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

#game-page-root {
  height: 100%;
  padding: $spacing-xs;
  box-sizing: border-box;

  #game-page-layout-container {
    height: 100%;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr) var(--tabs-width, 360px);
    grid-template-rows: auto minmax(0, 1fr);
    gap: $spacing-xs;

    >div {
      background: $bg-primary;
      backdrop-filter: blur(12px);
      border: 1px solid $border-color;
      border-radius: $spacing-xs;
      padding: $spacing-xs;
      box-shadow: $shadow-lg;
      overflow: hidden;
    }

    #header {
      grid-column: 1 / 4;
      grid-row: 1 / 2;

      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-xl $spacing-3xl;

      h1 {
        margin: 0;
        font-size: $font-6xl;
        font-weight: $font-weight-bold;
        letter-spacing: 0.02em;
        color: $text-primary;
      }

      #header-title-action {
        display: flex;
        flex-flow: row nowrap;
        gap: $spacing-4xl;
        align-items: center;
      }
    }

    #sidebar {
      grid-column: 1 / 2;
      grid-row: 2 / 3;
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      padding: $spacing-xs;
      overflow-y: auto;

      .mobile-sidebar-controls {
        display: none;
      }

      a,
      .sidebar-control-link {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: stretch;
        gap: 3px;
        padding: $spacing-lg $spacing-xl;
        border-radius: $radius-md;
        background: rgba(248, 250, 252, 0.72);
        font-weight: $font-weight-semibold;
        color: $text-secondary;
        transition:
          transform $transition-fast,
          box-shadow $transition-fast,
          background $transition-fast;
        cursor: pointer;
        user-select: none;

        &:hover:not(.active-link) {
          background: rgba(226, 232, 240, 0.9);
          transform: translateY(-2px);
          box-shadow: $shadow-sm;
        }

        &.active-link {
          background: $gradient-primary;
          color: #ffffff;
          box-shadow: 0 12px 22px $primary-rgba-28;
        }

        .skill-name {
          font-size: $font-base;
          line-height: 1.3;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: $spacing-lg;

          .name-text {
            flex: 0 0 auto;
          }

          .level-text {
            flex: 0 0 auto;
            font-size: $font-xs;
            opacity: 0.8;
          }
        }

        .skill-progress-wrapper {
          width: 100%;
          height: 3px;
          background: rgba(148, 163, 184, 0.2);
          border-radius: $spacing-xs;
          overflow: hidden;

          .skill-progress-bar {
            height: 100%;
            background: currentColor;
            transition: width $transition-slow;
          }
        }
      }
    }

    #content {
      grid-column: 2 / 3;
      grid-row: 2 / 3;
      padding: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      >* {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: $spacing-3xl;
      }
    }

    #tabs-container {
      grid-column: 3 / 4;
      grid-row: 2 / 3;
      display: flex;
      flex-direction: row;
      padding: 0;
      overflow: hidden;

      .drag-handle-left {
        width: $drag-handle-width;
        cursor: ew-resize;
        background: rgba(148, 163, 184, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.2s ease;

        &:hover {
          background: $primary-rgba-15;
        }

        .drag-indicator {
          width: $spacing-xs;
          height: 40px;
          background: rgba(148, 163, 184, 0.4);
          border-radius: 1px;
          transition: background 0.2s ease;
        }

        &:hover .drag-indicator {
          background: rgba(37, 99, 235, 0.6);
        }
      }

      .tabs-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
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
      padding: $spacing-xs;
    }

    #abilities {
      display: flex;
      justify-content: center;
      align-items: center;
      color: $text-quaternary;
      font-style: italic;
    }
  }
}

@media (max-width: 960px) {
  #game-page-root {
    padding: 0;
    position: relative;

    .sidebar-mask {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 999;
    }

    #game-page-layout-container {
      display: flex;
      flex-direction: column;
      height: 100%;

      >div {
        padding: $spacing-xs;
      }

      #header {
        .header-title h1 {
          display: none;
        }

        #header-title-action {
          width: 100%;
          justify-content: flex-end;
        }
      }

      #tabs-container {
        display: none;
      }

      #sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 56px !important;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(12px);
        box-shadow: 4px 0 12px $shadow-color;
        flex-direction: column;
        flex-wrap: nowrap;
        transition: width $transition-slow, transform $transition-slow;
        padding: $spacing-sm;

        .mobile-sidebar-controls {
          display: flex;
          flex-direction: column;
          gap: $spacing-xs;
          margin-bottom: $spacing-xs;

          .sidebar-control-link {
            flex: 0 0 auto;
          }
        }

        a,
        .sidebar-control-link {
          flex: 0 0 auto;
          padding: $spacing-lg $spacing-sm;

          .skill-name {
            font-size: $font-xs;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            .level-text {
              display: none;
            }
          }

          .skill-progress-wrapper {
            display: none;
          }
        }

        &.expanded {
          width: 200px !important;

          a,
          .sidebar-control-link {
            padding: $spacing-lg $spacing-xl;

            .skill-name {
              font-size: $font-base;
              text-align: left;
              display: flex;

              .level-text {
                display: inline;
              }
            }

            .skill-progress-wrapper {
              display: block;
            }
          }
        }
      }

      #content {
        flex: 1;
        min-height: 0;
        margin-left: 56px;

        >* {
          padding: $spacing-2xl;
        }
      }
    }

    &.sidebar-expanded #content {
      margin-left: 200px;
    }
  }
}

@media (min-width: 961px) {
  #game-page-root {
    .sidebar-mask {
      display: none;
    }

    #game-page-layout-container {
      #sidebar .mobile-sidebar-controls {
        display: none;
      }
    }
  }
}
</style>

