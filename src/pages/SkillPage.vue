<script setup lang="ts">
import { computed, ref, shallowRef, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'

import ActionModalBox from '@/components/modalBox/ActionModalBox.vue'
import { actionConfigListBySkill, getSkillTabActionConfigsMapBySkillId } from '@/gameConfig'
import { useSkillStore } from '@/stores/skill'

const { t, locale } = useI18n()
const route = useRoute()
const skillId = ref(route.params.id as string)
onBeforeRouteUpdate(async (to) => {
  skillId.value = to.params.id as string
})

const skillStore = useSkillStore()

const skill = computed(() => skillStore.getSkill(skillId.value))

// 判断是否需要使用 tab 分组
const skillActionTabs = computed(() => getSkillTabActionConfigsMapBySkillId(skillId.value))
const hasTabGroups = computed(() => Object.keys(skillActionTabs.value).length > 0)
const currentTab = ref<string>('')

// 获取可用的 tabs
const availableTabs = computed(() => Array.from(Object.keys(skillActionTabs.value)))

// 自动确保 currentTab 始终有效
watchEffect(() => {
  if (hasTabGroups.value && availableTabs.value.length > 0) {
    if (!currentTab.value || !availableTabs.value.includes(currentTab.value)) {
      currentTab.value = availableTabs.value[0]
    }
  }
})

// 显示的 actions
const displayedActions = computed(() => {
  if (!hasTabGroups.value) {
    return actionConfigListBySkill[skillId.value]
  }
  return skillActionTabs.value[currentTab.value] || []
})

// 预生成用于渲染的 tab 列表（方式 3）
const tabEntries = computed(() =>
  availableTabs.value.map((tab) => ({
    id: tab,
    label: t(`action.${tab}.name`),
  })),
)

const modalVisible = ref(false)
const selectedActionId = shallowRef<string | undefined>(undefined)

function openModal(actionId: string) {
  selectedActionId.value = actionId
  modalVisible.value = true
}
</script>

<template>
  <div v-if="skill" id="skill-page-container">
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
      <div class="progress-bar-container">
        <div
          class="progress-bar"
          :style="{
            width: skill.upgradeProgress * 100 + '%',
          }"
        ></div>
      </div>
    </div>

    <!-- Tab 切换区域 -->
    <div v-if="hasTabGroups" class="skill-tabs">
      <button
        v-for="tab in tabEntries"
        :key="tab.id"
        class="skill-tab"
        :class="{ active: currentTab === tab.id }"
        @click="currentTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div id="skill-area-root">
      <div
        v-for="action in displayedActions"
        :key="action.id"
        class="area-item"
        @click="openModal(action.id)"
      >
        <div>{{ t(action.name) }}</div>
      </div>
    </div>
  </div>
  <ActionModalBox v-model="modalVisible" :action-id="selectedActionId" />
</template>

<style lang="scss" scoped>
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
  }
}
</style>
