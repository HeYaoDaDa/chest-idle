<script setup lang="ts">
import ActionQueue from '@/components/misc/ActionQueue.vue'
import ChestProgressBar from '@/components/misc/ChestProgressBar.vue';
import { dataManager } from '@/models/global/DataManager';
import { inventory } from '@/models/global/InventoryManager';
import { Tooltip, Menu } from 'floating-vue';
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
          <ChestProgressBar v-for="chest in dataManager.allChest" :key="chest.id" :chest="chest" />
        </div>
      </div>
      <div id="sidebar">
        <Tooltip v-for="skill in dataManager.allSkill" :key="skill.id" theme="skill-tooltip">
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
          <template #popper>
            <div>{{ t(skill.name) }}</div>
            <div>Lv.{{ skill.level.value }}</div>
            <div>{{ skill.xp.value }}</div>
            <div>{{ skill.remainingXpForUpgrade.value }}</div>
            <hr />
            <div>{{ t(skill.description) }}</div>
          </template>
        </Tooltip>
      </div>
      <div id="content">
        <RouterView />
      </div>
      <div id="equipment">
        <template v-for="slot in dataManager.allSlot" :key="slot.id">
          <Menu v-if="slot.equipment.value">
            <Tooltip>
              <div class="equipment-item">
                <div>{{ t(slot.equipment.value.name) }}</div>
              </div>
              <template #popper>
                <div>
                  {{ t(slot.equipment.value.description) }}
                </div>
              </template>
            </Tooltip>
            <template #popper>
              <button @click="slot.unEquip()">UnEq</button>
            </template>
          </Menu>
          <div v-else>
            <div class="equipment-slot"><span>{{ t(slot.name) }}</span></div>
          </div>
        </template>
      </div>
      <div id="abilities"></div>
      <div id="invertory">
        <Menu v-for="inventoryItem in inventory.inventoryItems.value" :key="inventoryItem.item.id">
          <Tooltip>
            <div class="inventory-item">
              <div>{{ t(inventoryItem.item.name) }}</div>
              <div>{{ inventoryItem.amountDisplay.value }}</div>
            </div>
            <template #popper>
              <div>
                {{ t(inventoryItem.item.description) }}
              </div>
            </template>
          </Tooltip>
          <template #popper>
            <button v-if="inventoryItem.item.isEquipment()" @click="inventoryItem.equip()">Eq</button>
            <button v-if="inventoryItem.item.isChest()" @click="inventoryItem.openChest()">Open</button>
          </template>
        </Menu>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use 'sass:color';

#game-page-root {
  height: 100vh;
  padding: 8px;

  #game-page-layout-container {
    height: calc(100% - 16px);
    display: grid;
    grid-template-columns: 1fr 4fr 1fr 1fr;
    grid-template-rows: 1fr 4fr 8fr;
    gap: 8px;

    >div {
      border: 1px solid black;
      padding: 8px;
    }

    #header {
      grid-column: 1 / 5;
      grid-row: 1 / 2;

      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: flex-start;

      #header-title-action {
        display: flex;
        flex-flow: row nowrap;
        justify-content: flex-start;
        align-items: flex-start;
      }
    }

    #sidebar {
      grid-column: 1 / 2;
      grid-row: 2 / -1;

      a {
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        align-items: center;
        gap: 4px;
        padding: 8px;
        font-weight: 600;
        user-select: none;
        cursor: pointer;

        &:hover:not(.active-link) {
          background-color: color.adjust(white, $lightness: -5%);
        }

        &.active-link {
          background-color: color.adjust(white, $lightness: -10%);
        }
      }
    }

    #content {
      grid-column: 2 / 3;
      grid-row: 2 / -1;
    }

    #equipment {
      grid-column: 3 / 4;
      grid-row: 2 / 3;

      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-content: flex-start;
      align-items: flex-start;
      padding: 4px;
      gap: 10px;

      .equipment-item {
        min-width: 100px;
        min-height: 100px;
        background-color: color.adjust(white, $lightness: -10%);
        user-select: none;
        cursor: pointer;
      }

      .equipment-slot {
        min-width: 100px;
        min-height: 100px;
        background-color: color.adjust(white, $lightness: -10%);
        user-select: none;
        cursor: pointer;

        display: flex;
        justify-content: center;
        align-items: flex-end;
      }
    }

    #abilities {
      grid-column: 4 / 5;
      grid-row: 2 / 3;
    }

    #invertory {
      grid-column: 3 / 5;
      grid-row: 3 / 4;

      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-content: flex-start;
      align-items: flex-start;
      padding: 4px;
      gap: 10px;

      .inventory-item {
        min-width: 100px;
        min-height: 100px;
        background-color: color.adjust(white, $lightness: -10%);
        user-select: none;
        cursor: pointer;
      }
    }
  }
}
</style>
