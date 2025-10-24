<script setup lang="ts">
import ActionQueue from '@/components/misc/ActionQueue.vue'
import FloatingPopover from '@/components/misc/Popover.vue'
import { dataManager } from '@/models/global/DataManager';
import { inventory } from '@/models/global/InventoryManager';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()
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
        <FloatingPopover
          v-for="skill in dataManager.allSkill"
          :key="skill.id"
          placement="right"
          align="start"
          class="sidebar-popover"
        >
          <router-link :to="`/game/${skill.id}`" active-class="active-link">
            <div>
              {{ t(skill.name) }} {{ skill.level.value }}
            </div>
            <div style="width: 100%">
              <div :style="{
                width: skill.upgradeProgress.value * 100 + '%',
                height: '2px',
                backgroundColor: 'black',
              }"></div>
            </div>
          </router-link>
          <template #content>
            <div class="sidebar-popover-card">
              <div class="sidebar-popover-title">{{ t(skill.name) }}</div>
              <div class="sidebar-popover-level">Lv.{{ skill.level.value }}</div>
              <div>{{ skill.xp.value }}</div>
              <div>{{ skill.remainingXpForUpgrade.value }}</div>
              <hr />
              <div>{{ t(skill.description) }}</div>
            </div>
          </template>
        </FloatingPopover>
        <!--  -->
        <router-link :to="`/game/states`" active-class="active-link">
          <div>
            States
          </div>
          <div style="width: 100%">
            <div></div>
          </div>
        </router-link>
      </div>
      <div id="content">
        <RouterView />
      </div>
      <div id="equipment">
        <div
          v-for="slot in dataManager.allSlot"
          :key="slot.id"
          class="equipment-cell"
        >
          <FloatingPopover
            v-if="slot.equipment.value"
            trigger="click"
            placement="bottom"
            align="center"
            class="equipment-action-popover"
          >
            <FloatingPopover
              trigger="hover"
              placement="top"
              align="center"
              class="equipment-info-popover"
            >
              <div class="equipment-item">
                <div>{{ t(slot.equipment.value.name) }}</div>
              </div>
              <template #content>
                <div class="equipment-tooltip">
                  {{ t(slot.equipment.value.description) }}
                </div>
              </template>
            </FloatingPopover>
            <template #content="{ close }">
              <div class="popover-action-list">
                <button
                  type="button"
                  class="popover-action-button"
                  @click="slot.unEquip(); close()"
                >
                  UnEq
                </button>
              </div>
            </template>
          </FloatingPopover>
          <div v-else class="equipment-slot"><span>{{ t(slot.name) }}</span></div>
        </div>
      </div>
      <div id="abilities"></div>
      <div id="invertory">
        <div
          v-for="inventoryItem in inventory.inventoryItems.value"
          :key="inventoryItem.item.id"
          class="inventory-cell"
        >
          <FloatingPopover
            trigger="click"
            placement="bottom"
            align="center"
            class="inventory-action-popover"
          >
            <FloatingPopover
              trigger="hover"
              placement="top"
              align="center"
              class="inventory-info-popover"
            >
              <div class="inventory-item">
                <div>{{ t(inventoryItem.item.name) }}</div>
                <div>{{ inventoryItem.amountDisplay.value }}</div>
              </div>
              <template #content>
                <div class="inventory-tooltip">
                  {{ t(inventoryItem.item.description) }}
                </div>
              </template>
            </FloatingPopover>
            <template #content="{ close }">
              <div class="popover-action-list">
                <button
                  v-if="inventoryItem.item.isEquipment()"
                  type="button"
                  class="popover-action-button"
                  @click="inventoryItem.equip(); close()"
                >
                  Eq
                </button>
                <button
                  v-if="inventoryItem.item.isChest()"
                  type="button"
                  class="popover-action-button"
                  @click="inventoryItem.openChest(); close()"
                >
                  Open
                </button>
              </div>
            </template>
          </FloatingPopover>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
#game-page-root {
  height: 100%;
  padding: 24px;
  box-sizing: border-box;

  #game-page-layout-container {
    height: 100%;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr) 280px 280px;
    grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr);
    gap: 20px;

    >div {
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 16px;
      padding: 18px;
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
      padding: 20px 24px;

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
        gap: 32px;
        align-items: center;
      }
    }

    #sidebar {
      grid-column: 1 / 2;
      grid-row: 2 / 4;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px;
      overflow-y: auto;

      .sidebar-popover {
        display: block;
        width: 100%;
      }

      .sidebar-popover-card {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 180px;
      }

      .sidebar-popover-title {
        font-weight: 600;
        color: #1e293b;
      }

      .sidebar-popover-level {
        font-size: 13px;
        font-weight: 500;
        color: #2563eb;
      }

      .sidebar-popover-card hr {
        margin: 8px 0;
        border: none;
        border-top: 1px solid rgba(148, 163, 184, 0.32);
      }

      a {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 6px;
        padding: 12px 16px;
        width: 100%;
        border-radius: 12px;
        background: rgba(248, 250, 252, 0.72);
        font-weight: 600;
        color: #1e293b;
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
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

      > * {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 24px;
      }
    }

    #equipment {
      grid-column: 3 / 4;
      grid-row: 2 / 3;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 14px;
      padding: 18px;
      align-content: start;

      .equipment-cell {
        display: flex;
      }

      .equipment-action-popover,
      .equipment-info-popover {
        display: block;
        width: 100%;
      }

      .equipment-item,
      .equipment-slot {
        min-height: 110px;
        border-radius: 12px;
        background: rgba(248, 250, 252, 0.9);
        border: 1px dashed rgba(148, 163, 184, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 12px;
        font-weight: 600;
        color: #1e293b;
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        cursor: pointer;
      }

      .equipment-item {
        border-style: solid;
        background: rgba(226, 232, 240, 0.9);

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 20px rgba(15, 23, 42, 0.12);
        }
      }

      .equipment-tooltip {
        max-width: 240px;
        font-size: 13px;
        line-height: 1.4;
        color: #0f172a;
      }
    }

    #abilities {
      grid-column: 4 / 5;
      grid-row: 2 / 3;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 16px;
      background: rgba(248, 250, 252, 0.72);
      color: #94a3b8;
      font-style: italic;
    }

    #invertory {
      grid-column: 3 / 5;
      grid-row: 3 / 4;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 14px;
      padding: 18px;
      align-content: start;
      overflow: auto;

      .inventory-cell {
        display: flex;
      }

      .inventory-action-popover,
      .inventory-info-popover {
        display: block;
        width: 100%;
      }

      .inventory-item {
        border-radius: 12px;
        background: rgba(248, 250, 252, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.3);
        min-height: 110px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        color: #1e293b;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 20px rgba(15, 23, 42, 0.12);
        }
      }

      .inventory-tooltip {
        max-width: 240px;
        font-size: 13px;
        line-height: 1.4;
        color: #0f172a;
      }
    }

    .popover-action-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .popover-action-button {
      border: none;
      border-radius: 999px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      color: #ffffff;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .popover-action-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 20px rgba(37, 99, 235, 0.24);
    }
  }
}

@media (max-width: 1280px) {
  #game-page-root {
    padding: 16px;

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

      #invertory {
        grid-column: 1 / 3;
        grid-row: 5 / 6;
        max-height: 280px;
      }
    }
  }
}

@media (max-width: 960px) {
  #game-page-root {
    padding: 12px;

    #game-page-layout-container {
      display: flex;
      flex-direction: column;

      >div {
        padding: 16px;
      }

      #sidebar {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: stretch;

        a {
          flex: 1 1 140px;
        }
      }

      #content > * {
        padding: 20px;
      }

      #invertory {
        max-height: none;
      }
    }
  }
}
</style>
