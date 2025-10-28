<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue'
import { INFINITE_STRING } from '@/constants'
import type { ActionTarget } from '@/models/actionTarget'
import { actionManager } from '@/models/global/ActionManager'
import { dataManager } from '@/models/global/DataManager'
import { inventory } from '@/models/global/InventoryManager'
import { isIntegerOrInfinity, stringToNumber } from '@/utils'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'

const { t, locale } = useI18n()
const route = useRoute()
const skillId = ref(route.params.id as string)
onBeforeRouteUpdate(async (to) => {
  skillId.value = to.params.id as string
})

const skill = computed(() => dataManager.getSkillById(skillId.value))

// 判断是否需要使用 tab 分组
const hasTabGroups = computed(() => skill.value.actionTargetTabMap.size > 0)
const currentTab = ref<string>('')

// 获取可用的 tabs
const availableTabs = computed(() => Array.from(skill.value.actionTargetTabMap.keys()))

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
    return skill.value.actionTargets
  }
  return skill.value.actionTargetTabMap.get(currentTab.value) || []
})

const openZone = shallowRef(undefined as ActionTarget | undefined)
const amountString = ref(INFINITE_STRING)
const allowAmount = computed(() => isIntegerOrInfinity(amountString.value))
const durationSeconds = computed(() => (openZone.value ? openZone.value.duration.value / 1000 : 0))
const xpPerCycle = computed(() => openZone.value?.xp.value ?? 0)
const chestPointsPerCycle = computed(() => openZone.value?.chestPoints.value ?? 0)
const hasIngredients = computed(() => (openZone.value?.ingredients.length ?? 0) > 0)
const hasProducts = computed(() => (openZone.value?.products.length ?? 0) > 0)
const hasCurrentAction = computed(() => !!actionManager.currentAction.value)
const queuePosition = computed(() => actionManager.queuedActions.length + 1)

// 不满足条件的标记（用于字段标红）
const isLevelInsufficient = computed(() => {
  if (!openZone.value) return false
  return openZone.value.skill.level.value < openZone.value.minLevel
})

const insufficientIngredients = computed(() => {
  if (!openZone.value || !('ingredients' in openZone.value)) return [] as string[]
  const lack: string[] = []
  for (const ingredient of openZone.value.ingredients) {
    const inventoryItem = inventory.inventoryItemMap.get(ingredient.item.id)
    const available = inventoryItem?.amount.value ?? 0
    if (available < ingredient.count) lack.push(ingredient.item.id)
  }
  return lack
})

const hasInsufficientIngredients = computed(() => insufficientIngredients.value.length > 0)

// 检查是否满足开始条件
const canStartAction = computed(() => {
  if (!openZone.value) return { canStart: false, reasons: [] }

  const reasons: string[] = []

  // 检查等级要求
  if (openZone.value.skill.level.value < openZone.value.minLevel) {
    reasons.push(t('notification.levelTooLow', {
      skill: t(openZone.value.skill.name),
      level: openZone.value.skill.level.value,
      required: openZone.value.minLevel,
      action: t(openZone.value.name)
    }))
  }

  // 检查材料是否足够
  if ('ingredients' in openZone.value && openZone.value.ingredients.length > 0) {
    for (const ingredient of openZone.value.ingredients) {
      const inventoryItem = inventory.inventoryItemMap.get(ingredient.item.id)
      const available = inventoryItem?.amount.value ?? 0
      if (available < ingredient.count) {
        reasons.push(t('ui.insufficientMaterial', {
          item: t(ingredient.item.name),
          required: ingredient.count,
          available: available
        }))
      }
    }
  }

  return {
    canStart: reasons.length === 0,
    reasons
  }
})

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString(locale.value, { minimumFractionDigits: 0, maximumFractionDigits })
function openModal(zone: ActionTarget) {
  openZone.value = zone
}
function closeModal() {
  openZone.value = undefined
  amountString.value = INFINITE_STRING
}
function addAction() {
  if (openZone.value) {
    actionManager.addAction(openZone.value, stringToNumber(amountString.value))
    closeModal()
  }
}

function startImmediately() {
  if (openZone.value) {
    // 立即开始：若有运行中，打断并将原运行项排到队首，然后立即开始新行动
    actionManager.startImmediately(openZone.value, stringToNumber(amountString.value))
    closeModal()
  }
}

function handleAmountFocus(event: FocusEvent) {
  const target = event.target as HTMLInputElement
  window.requestAnimationFrame(() => target.select())
}
</script>

<template>
  <div id="skill-page-container">
    <div class="skill-header">
      <div class="skill-header-main">
        <h2 class="skill-title">{{ t(skill.name) }}</h2>
        <div class="skill-level">{{ t('ui.level', { level: skill.level.value }) }}</div>
      </div>
      <div class="skill-description">{{ t(skill.description) }}</div>
      <div class="skill-stats">
        <div class="skill-stat">
          <span class="skill-stat-label">{{ t('ui.xp') }}</span>
          <span class="skill-stat-value">{{ skill.xp.value.toLocaleString(locale) }}</span>
        </div>
        <div class="skill-stat">
          <span class="skill-stat-label">{{ t('ui.nextLevel') }}</span>
          <span class="skill-stat-value">{{
            skill.remainingXpForUpgrade.value.toLocaleString(locale)
          }}</span>
        </div>
      </div>
      <div class="skill-progress-bar-container">
        <div
          class="skill-progress-bar"
          :style="{
            width: skill.upgradeProgress.value * 100 + '%',
          }"
        ></div>
      </div>
    </div>

    <!-- Tab 切换区域 -->
    <div v-if="hasTabGroups" class="skill-tabs">
      <button
        v-for="tab in availableTabs"
        :key="tab"
        class="skill-tab"
        :class="{ active: currentTab === tab }"
        @click="currentTab = tab"
      >
        {{ t(`actionTarget.${tab}.name`) }}
      </button>
    </div>

    <div id="skill-area-root">
      <div
        v-for="zone in displayedActionTargets"
        :key="zone.id"
        class="area-item"
        @click="openModal(zone)"
      >
        <div>{{ t(zone.name) }}</div>
        <div class="chest-progress">
          <div
            class="chest-progress-bar"
            :style="{
              width: (zone.chest.points.value / zone.chest.maxPoints) * 100 + '%',
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
  <ModalBox v-if="openZone" @close="closeModal">
    <div class="zone-modal">
      <header class="zone-header">
        <div class="zone-header-text">
          <span class="zone-overline">{{ t(openZone.skill.name) }}</span>
          <h2 class="zone-title">{{ t(openZone.name) }}</h2>
          <p class="zone-description">{{ t(openZone.description) }}</p>
        </div>
        <button type="button" class="zone-close" @click="closeModal">×</button>
      </header>

      <div class="zone-info-list">
        <div class="info-row" :class="{ error: isLevelInsufficient }">
          <span class="info-label">{{ t('minLevelRequired') }}</span>
          <span class="info-value">{{ openZone.minLevel }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('duration') }}</span>
          <span class="info-value">{{ t('ui.seconds', { value: formatNumber(durationSeconds, 1) }) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('ui.xpPerCycle') }}</span>
          <span class="info-value">{{ formatNumber(xpPerCycle) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('ui.chestPoints') }}</span>
          <span class="info-value">{{ formatNumber(chestPointsPerCycle, 2) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('ui.chest') }}</span>
          <span class="info-value">{{ t(openZone.chest.name) }}</span>
        </div>

        <div class="info-row" :class="{ error: hasIngredients && hasInsufficientIngredients }">
          <span class="info-label">{{ t('ui.requiredMaterials') }}</span>
          <span class="info-value">
            <template v-if="hasIngredients">
              <template v-for="(ingredient, idx) in openZone.ingredients" :key="ingredient.item.id">
                <span>{{ t(ingredient.item.name) }} ×{{ formatNumber(ingredient.count) }}</span><span v-if="idx < openZone.ingredients.length - 1">，</span>
              </template>
            </template>
            <template v-else>
              {{ t('ui.noMaterialsRequired') }}
            </template>
          </span>
        </div>

        <div class="info-row">
          <span class="info-label">{{ t('ui.rewards') }}</span>
          <span class="info-value">
            <template v-if="hasProducts">
              <template v-for="(product, idx) in openZone.products" :key="product.item.id">
                <span>{{ t(product.item.name) }} ×{{ formatNumber(product.count) }}</span><span v-if="idx < openZone.products.length - 1">，</span>
              </template>
            </template>
            <template v-else>
              {{ t('ui.noRewards') }}
            </template>
          </span>
        </div>
      </div>

      <!-- 不再显示整块警告，改为字段级标红提示 -->

      <div class="zone-actions">
        <label class="zone-amount">
          <span class="zone-amount-label">{{ t('ui.amount') }}</span>
          <div class="zone-amount-input">
            <input type="text" v-model="amountString" @focus="handleAmountFocus" />
            <button
              type="button"
              class="zone-amount-infinity"
              :title="t('ui.unlimited')"
              @click="amountString = INFINITE_STRING"
            >
              {{ INFINITE_STRING }}
            </button>
          </div>
        </label>
        <div class="zone-action-buttons">
          <button
            v-if="hasCurrentAction"
            type="button"
            class="zone-button secondary"
            @click="addAction"
            :disabled="!allowAmount || !canStartAction.canStart"
          >
            {{ t('ui.addToQueue', { position: queuePosition }) }}
          </button>
          <button
            type="button"
            class="zone-button primary"
            @click="hasCurrentAction ? startImmediately() : addAction()"
            :disabled="!allowAmount || !canStartAction.canStart"
          >
            {{ hasCurrentAction ? t('ui.startImmediately') : t('start') }}
          </button>
        </div>
      </div>
    </div>
  </ModalBox>
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

.zone-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-2xl;
  min-width: min(460px, 100%);
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.zone-header-text {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.zone-overline {
  text-transform: uppercase;
  font-size: $font-sm;
  letter-spacing: 0.08em;
  color: #6b7280;
}

.zone-title {
  margin: 0;
  font-size: $font-5xl;
  line-height: 1.2;
}

.zone-description {
  margin: 0;
  color: $text-tertiary;
  line-height: 1.5;
}

.zone-close {
  border: none;
  background: rgba(148, 163, 184, 0.16);
  color: $text-tertiary;
  border-radius: $radius-full;
  width: $modal-close-button-size;
  height: $modal-close-button-size;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: $font-4xl;
  line-height: 1;

  &:hover {
    background: rgba(71, 85, 105, 0.22);
    color: #1f2937;
  }
}

.zone-info-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.zone-actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.zone-amount {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.zone-amount-label {
  font-size: $font-base;
  font-weight: $font-weight-semibold;
  color: #1f2937;
}

.zone-amount-input {
  display: flex;
  gap: $spacing-md;

  input {
    flex: 1;
    border: 1px solid #cbd5f5;
    border-radius: $radius-sm;
    padding: $spacing-lg $spacing-xl;
    font-size: $font-md;
    color: $text-primary;

    &:focus {
      outline: none;
      border-color: $primary-light;
      box-shadow: 0 0 0 3px $primary-rgba-18;
    }
  }
}

.zone-amount-infinity {
  border: none;
  border-radius: $radius-sm;
  background: #e2e8f0;
  color: $text-primary;
  padding: 0 $spacing-2xl;
  cursor: pointer;
  font-size: $font-xl;

  &:hover {
    background: #cbd5f5;
  }
}

@media (max-width: 540px) {
  .zone-modal {
    min-width: unset;
  }

  .info-row {
    gap: $spacing-md;
  }

  .zone-button {
    width: 100%;
  }

  .zone-action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>


