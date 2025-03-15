<script setup lang="ts">
import ActionQueue from '@/components/misc/ActionQueue.vue'
import LanguageSelect from '@/components/misc/LanguageSelect.vue'
import NotificationBar from '@/components/misc/NotificationBar.vue'
import { global } from '@/global'
import { useActionStore } from '@/stores/action'
import { useInventoryStore } from '@/stores/inventory'
import { Tooltip } from 'floating-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const actionStore = useActionStore()
const inventoryStore = useInventoryStore()
</script>

<template>
  <div id="game-page-root">
    <div id="game-page-layout-container">
      <div id="header">
        <div>
          <h1>{{ t('gameName') }}</h1>
          <ActionQueue v-if="actionStore.isRunning" />
        </div>
        <NotificationBar />
      </div>
      <div id="sidebar">
        <Tooltip v-for="characterSkill in global.allSkills" :key="characterSkill.id" theme="skill-tooltip">
          <router-link :to="`/game/${characterSkill.id}`" active-class="active-link">
            <div>
              {{ characterSkill.name }} {{ characterSkill.level }}
            </div>
            <div style="width: 100%">
              <div :style="{
                width: characterSkill.progress.value + '%',
                height: '2px',
                backgroundColor: 'black',
              }"></div>
            </div>
          </router-link>
          <template #popper>
            <div>{{ characterSkill.name.value }}</div>
            <div>Lv.{{ characterSkill.level.value }}</div>
            <div>{{ characterSkill.xp.value }}</div>
            <div>{{ characterSkill.nextLevelNeedXp.value }}</div>
            <hr />
            <div>{{ characterSkill.description.value }}</div>
          </template>
        </Tooltip>
        <LanguageSelect />
      </div>
      <div id="content">
        <RouterView />
      </div>
      <div id="equipment"></div>
      <div id="abilities"></div>
      <div id="invertory">
        <Tooltip v-for="inventoryItem in inventoryStore.inventoryItems" :key="inventoryItem.item.id"
          theme="item-tooltip">
          <div class="inventory-item">
            <div>{{ inventoryItem.item.getName() }}</div>
            <div>{{ inventoryItem.amount }}</div>
          </div>
          <template #popper>
            <div>
              {{ inventoryItem.item.getDescription() }}
            </div>
          </template>
        </Tooltip>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use 'sass:color';

#game-page-root {
  height: 100vh;
  padding: 4px;

  #game-page-layout-container {
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 4fr 1fr 1fr;
    grid-template-rows: 1fr 4fr 8fr;
    gap: 8px;

    >div {
      box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
      padding: 8px;
      border-radius: 4px;
    }

    #header {
      grid-column: 1 / 5;
      grid-row: 1 / 2;

      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: flex-start;
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
          background-color: color.adjust(white, $lightness: 10%);
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
      min-width: 256px;
      height: 100%;

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
