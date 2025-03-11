<script setup lang="ts">
import LanguageSelect from '@/components/misc/LanguageSelect.vue';
import { useDataStore } from '@/stores/data';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()
const dataStore = useDataStore();
</script>

<template>
  <div id="game-page-root">
    <div id="game-page-layout-container">
      <div id="header">
        <h1>{{ t('gameName') }}</h1>
      </div>
      <div id="sidebar">
        <router-link v-for="skillData in dataStore.allSkillDatas" :key="skillData.id" :to="`/game/${skillData.id}`"
          active-class="active-link">
          {{ skillData.getName() }}
        </router-link>
        <LanguageSelect />
      </div>
      <div id="content">
        <RouterView />
      </div>
      <div id="equipment"></div>
      <div id="abilities"></div>
      <div id="invertory"></div>
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
    }

    #sidebar {
      grid-column: 1 / 2;
      grid-row: 2 / -1;

      a {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 4px;
        padding: 8px;
        font-weight: 600;
        user-select: none;
        cursor: pointer;

        &:hover:not(.active-link) {
          background-color: color.adjust(white, $lightness: 10%);
          ;
        }

        &.active-link {
          background-color: color.adjust(white, $lightness: -10%);
          ;
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
    }
  }
}
</style>
