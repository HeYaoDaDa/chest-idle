<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import ModalBox from '@/components/ModalBox.vue'
import { INFINITE_STRING } from '@/constant'
import { itemConfigMap } from '@/gameConfig'
import { useActionStore } from '@/stores/action'
import { useActionQueueStore } from '@/stores/actionQueue'
import { useInventoryStore } from '@/stores/inventory'
import { useSkillStore } from '@/stores/skill'
import { isIntegerOrInfinity, stringToNumber } from '@/utils'

const { t, locale } = useI18n()

const inventoryStore = useInventoryStore()
const skillStore = useSkillStore()
const actionStore = useActionStore()
const actionQueueStore = useActionQueueStore()

// Props
interface Props {
  modelValue: boolean
  actionId?: string
}

const props = defineProps<Props>()
const action = computed(() => {
  if (!props.actionId) return null
  return actionStore.getActionById(props.actionId)
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 获取技能信息
const skill = computed(() => {
  if (!action.value) return null
  return skillStore.getSkill(action.value.skillId)
})

const amountString = ref(INFINITE_STRING)
const allowAmount = computed(() => isIntegerOrInfinity(amountString.value))
const durationSeconds = computed(() => (action.value ? action.value.duration / 1000 : 0))
const xpPerCycle = computed(() => action.value?.xp ?? 0)
const chestPointsPerCycle = computed(() => action.value?.chestPoints ?? 0)
const hasIngredients = computed(() => (action.value?.ingredients.length ?? 0) > 0)
const hasProducts = computed(() => (action.value?.products.length ?? 0) > 0)
const hasCurrentAction = computed(() => !!actionQueueStore.currentAction)
const queuePosition = computed(() => actionQueueStore.queueLength + 1)

// 不满足条件的标记（用于字段标红）
const isLevelInsufficient = computed(() => {
  if (!action.value || !skill.value) return false
  return skill.value.level < action.value.minLevel
})

const insufficientIngredients = computed(() => {
  if (!action.value || !('ingredients' in action.value)) return [] as string[]
  const lack: string[] = []
  for (const ingredient of action.value.ingredients) {
    const available = inventoryStore.inventoryMap[ingredient.itemId] ?? 0
    if (available < ingredient.count) lack.push(ingredient.itemId)
  }
  return lack
})

const hasInsufficientIngredients = computed(() => insufficientIngredients.value.length > 0)

// 检查是否满足开始条件
const canStartAction = computed(() => {
  if (!action.value) return { canStart: false, reasons: [] }

  const reasons: string[] = []

  // 检查等级要求
  if (skill.value && skill.value.level < action.value.minLevel) {
    reasons.push(
      t('notification.levelTooLow', {
        skill: t(skill.value.name),
        level: skill.value.level,
        required: action.value.minLevel,
        action: t(action.value.name),
      }),
    )
  }

  // 检查材料是否足够
  if ('ingredients' in action.value && action.value.ingredients.length > 0) {
    for (const ingredient of action.value.ingredients) {
      const available = inventoryStore.inventoryMap[ingredient.itemId] ?? 0
      const itemConfig = itemConfigMap[ingredient.itemId]
      if (available < ingredient.count) {
        reasons.push(
          t('ui.insufficientMaterial', {
            item: t(itemConfig.name),
            required: ingredient.count,
            available: available,
          }),
        )
      }
    }
  }

  return {
    canStart: reasons.length === 0,
    reasons,
  }
})

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString(locale.value, { minimumFractionDigits: 0, maximumFractionDigits })

function closeModal() {
  emit('update:modelValue', false)
  amountString.value = INFINITE_STRING
}

function addAction() {
  if (action.value) {
    actionQueueStore.addAction(action.value.id, stringToNumber(amountString.value))
    closeModal()
  }
}

function startImmediately() {
  if (action.value) {
    // 立即开始：若有运行中，打断并将原运行项排到队首，然后立即开始新行动
    actionQueueStore.startImmediately(action.value.id, stringToNumber(amountString.value))
    closeModal()
  }
}

function handleAmountFocus(event: FocusEvent) {
  const target = event.target as HTMLInputElement
  window.requestAnimationFrame(() => target.select())
}

// 当模态框关闭时重置 amountString
watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      amountString.value = INFINITE_STRING
    }
  },
)
</script>

<template>
  <ModalBox v-if="modelValue && action" @close="closeModal">
    <div class="zone-modal">
      <header class="zone-header">
        <div class="zone-header-text">
          <span class="zone-overline">{{ skill ? t(skill.name) : '' }}</span>
          <h2 class="zone-title">{{ t(action.name) }}</h2>
          <p class="zone-description">{{ t(action.description) }}</p>
        </div>
        <button type="button" class="zone-close" @click="closeModal">×</button>
      </header>

      <div class="zone-info-list">
        <div class="info-row" :class="{ error: isLevelInsufficient }">
          <span class="info-label">{{ t('minLevelRequired') }}</span>
          <span class="info-value">{{ action.minLevel }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('duration') }}</span>
          <span class="info-value">{{
            t('ui.seconds', { value: formatNumber(durationSeconds, 1) })
          }}</span>
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
          <span class="info-value">{{ t(itemConfigMap[action.chestId].name) }}</span>
        </div>

        <div class="info-row" :class="{ error: hasIngredients && hasInsufficientIngredients }">
          <span class="info-label">{{ t('ui.requiredMaterials') }}</span>
          <span class="info-value">
            <template v-if="hasIngredients">
              <template v-for="(ingredient, idx) in action.ingredients" :key="ingredient.itemId">
                <span
                  >{{ t(itemConfigMap[ingredient.itemId].name) }} ×{{
                    formatNumber(ingredient.count)
                  }}</span
                ><span v-if="idx < action.ingredients.length - 1">，</span>
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
              <template v-for="(product, idx) in action.products" :key="product.itemId">
                <span
                  >{{ t(itemConfigMap[product.itemId].name) }} ×{{
                    formatNumber(product.count)
                  }}</span
                ><span v-if="idx < action.products.length - 1">，</span>
              </template>
            </template>
            <template v-else>
              {{ t('ui.noRewards') }}
            </template>
          </span>
        </div>
      </div>

      <div class="zone-actions">
        <label class="zone-amount">
          <span class="zone-amount-label">{{ t('ui.amount') }}</span>
          <div class="zone-amount-input">
            <input v-model="amountString" type="text" @focus="handleAmountFocus" />
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
            :disabled="!allowAmount || !canStartAction.canStart"
            @click="addAction"
          >
            {{ t('ui.addToQueue', { position: queuePosition }) }}
          </button>
          <button
            type="button"
            class="zone-button primary"
            :disabled="!allowAmount || !canStartAction.canStart"
            @click="hasCurrentAction ? startImmediately() : addAction()"
          >
            {{ hasCurrentAction ? t('ui.startImmediately') : t('start') }}
          </button>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss" scoped>
@use '@/styles/shared-components';

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
