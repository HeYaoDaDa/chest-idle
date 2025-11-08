<script setup lang="ts">
import ActionModalBox from '@/components/misc/ActionModalBox.vue'
import type { ActionTarget } from '@/models/actionTarget'
import { useGameConfigStore } from '@/stores/gameConfig'
import { usePlayerStore } from '@/stores/player'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'

const { t, locale } = useI18n()
const route = useRoute()
const skillId = ref(route.params.id as string)
onBeforeRouteUpdate(async (to) => {
  skillId.value = to.params.id as string
})

const gameConfigStore = useGameConfigStore()
const playerStore = usePlayerStore()

const skill = computed(() => playerStore.getSkill(skillId.value))

// 判断是否需要使用 tab 分组
const skillActionTargetTabs = computed(() => gameConfigStore.getSkillActionTargetTabs(skillId.value))
const hasTabGroups = computed(() => skillActionTargetTabs.value.size > 0)
const currentTab = ref<string>('')

// 获取可用的 tabs
const availableTabs = computed(() => Array.from(skillActionTargetTabs.value.keys()))

// 确保 currentTab 始终有效
const ensureValidTab = () => {
  if (hasTabGroups.value && availableTabs.value.length > 0) {
    if (!currentTab.value || !availableTabs.value.includes(currentTab.value)) {
      currentTab.value = availableTabs.value[0]
    }
  }
}

// 监听技能变化，重置 tab
onBeforeRouteUpdate(() => {
  ensureValidTab()
})

// 首次加载时初始化
ensureValidTab()

// 显示的 actionTargets
const displayedActionTargets = computed(() => {
  if (!hasTabGroups.value) {
    return gameConfigStore.getSkillActionTargets(skillId.value)
  }
  return skillActionTargetTabs.value.get(currentTab.value) || []
})

const modalVisible = ref(false)
const selectedActionTarget = shallowRef<ActionTarget | undefined>(undefined)

function openModal(zone: ActionTarget) {
  selectedActionTarget.value = zone
  modalVisible.value = true
}
</script>

<template>
  <div id="skill-page-container" v-if="skill">
    <div class="skill-header">
      <div class="skill-header-main">
        <h2 class="skill-title">{{ t(skill.name) }}</h2>
        <div class="skill-level">{{ t('ui.level', { level: skill.level }) }}</div>
      </div>
      <div class="skill-description">{{ t(skill.description) }}</div>
      <div class="skill-stats">
        <div class="skill-stat">
          <span class="skill-stat-label">{{ t('ui.xp') }}</span>
          <span class="skill-stat-value">{{ skill.xp.toLocaleString(locale) }}</span>
        </div>
        <div class="skill-stat">
          <span class="skill-stat-label">{{ t('ui.nextLevel') }}</span>
          <span class="skill-stat-value">{{
            skill.remainingXpForUpgrade.toLocaleString(locale)
            }}</span>
        </div>
      </div>
      <div class="skill-progress-bar-container">
        <div class="skill-progress-bar" :style="{
          width: skill.upgradeProgress * 100 + '%',
        }"></div>
      </div>
    </div>

    <!-- Tab 切换区域 -->
    <div v-if="hasTabGroups" class="skill-tabs">
      <button v-for="tab in availableTabs" :key="tab" class="skill-tab" :class="{ active: currentTab === tab }"
        @click="currentTab = tab">
        {{ t(`actionTarget.${tab}.name`) }}
      </button>
    </div>

    <div id="skill-area-root">
      <div v-for="zone in displayedActionTargets" :key="zone.id" class="area-item" @click="openModal(zone)">
        <div>{{ t(zone.name) }}</div>
        <div class="chest-progress">
          <div class="chest-progress-bar" :style="{
            width: (playerStore.getChestProgress(zone.chest.id) * 100) + '%',
          }"></div>
        </div>
      </div>
    </div>
  </div>
  <ActionModalBox v-model="modalVisible" :action-target="selectedActionTarget" />
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/shared-components';

#skill-page-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.skill-header {
  background: $gradient-header;
  border: 1px solid $primary-rgba-18;
  border-radius: $spacing-xl;
  padding: $spacing-lg $spacing-xl;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  align-items: center;
  text-align: center;

  .skill-header-main {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: $spacing-md;
  }

  .skill-title {
    margin: 0;
    font-size: $font-xl;
    font-weight: $font-weight-bold;
    color: $text-primary;
    letter-spacing: 0.01em;
  }

  .skill-level {
    font-size: 11px;
    font-weight: $font-weight-semibold;
    color: $primary-color;
    background: $primary-rgba-12;
    padding: 1px $spacing-md;
    border-radius: $radius-full;
  }

  .skill-description {
    color: $text-tertiary;
    line-height: 1.3;
    font-size: 11px;
    margin: 0;
  }

  .skill-stats {
    display: flex;
    gap: $spacing-xl;
    flex-wrap: wrap;
    justify-content: center;
  }

  .skill-stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
    align-items: center;
  }

  .skill-stat-label {
    font-size: $font-xs;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $text-quaternary;
    font-weight: $font-weight-normal;
  }

  .skill-stat-value {
    font-size: $font-md;
    font-weight: $font-weight-bold;
    color: $text-secondary;
  }

  .skill-progress-bar-container {
    width: 100%;
    height: $progress-bar-height;
    background-color: rgba(226, 232, 240, 0.6);
    border-radius: $radius-full;
    overflow: hidden;

    .skill-progress-bar {
      height: 100%;
      background: $gradient-primary;
      transition: width $transition-slow;
      box-shadow: 0 0 8px $primary-rgba-40;
    }
  }
}

.skill-tabs {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
  padding: $spacing-sm;
  background: $bg-input;
  border: 1px solid $border-color;
  border-radius: $radius-md;
}

.skill-tab {
  padding: $spacing-md $spacing-xl;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: rgba(248, 250, 252, 0.72);
  color: $text-secondary;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition:
    background $transition-fast,
    color $transition-fast,
    border-color $transition-fast;

  &:hover:not(.active) {
    background: rgba(226, 232, 240, 0.9);
  }

  &.active {
    background: $gradient-primary;
    color: #ffffff;
    border-color: transparent;
  }
}

#skill-area-root {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-content: flex-start;
  align-items: flex-start;
  gap: $spacing-md;

  .area-item {
    width: $grid-item-size;
    height: $grid-item-size;
    border-radius: $radius-md;
    background: $bg-input;
    border: 1px solid $border-color;
    box-shadow: $shadow-xs;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    text-align: center;
    user-select: none;
    cursor: pointer;
    box-sizing: border-box;
    font-size: $font-sm;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-md;
      border-color: $primary-rgba-35;
    }

    .chest-progress {
      width: 100%;
      height: $progress-bar-height;
      background-color: rgba(226, 232, 240, 0.9);
      border-radius: $radius-full;
      overflow: hidden;

      .chest-progress-bar {
        height: 100%;
        background: $cyan-gradient;
        transition: width $transition-slow;
      }
    }
  }
}
</style>
