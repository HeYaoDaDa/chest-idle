<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue'
import { INFINITE_STRING } from '@/constants'
import type { ActionTarget } from '@/models/actionTarget'
import { actionManager } from '@/models/global/ActionManager'
import { dataManager } from '@/models/global/DataManager'
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

const openZone = shallowRef(undefined as ActionTarget | undefined)
const amountString = ref(INFINITE_STRING)
const allowAmount = computed(() => isIntegerOrInfinity(amountString.value))
const durationSeconds = computed(() => (openZone.value ? openZone.value.duration.value / 1000 : 0))
const xpPerCycle = computed(() => openZone.value?.xp.value ?? 0)
const chestPointsPerCycle = computed(() => openZone.value?.chestPoints.value ?? 0)
const hasIngredients = computed(() => (openZone.value?.ingredients.length ?? 0) > 0)
const hasProducts = computed(() => (openZone.value?.products.length ?? 0) > 0)
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
  } else {
    console.error('openZone is null')
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

    <div id="skill-area-root">
      <div
        v-for="zone in skill.actionTargets"
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

      <div class="zone-stats">
        <div class="zone-stat">
          <span class="zone-stat-label">{{ t('minLevelRequired') }}</span>
          <span class="zone-stat-value">{{ openZone.minLevel }}</span>
        </div>
        <div class="zone-stat">
          <span class="zone-stat-label">{{ t('duration') }}</span>
          <span class="zone-stat-value">{{
            t('ui.seconds', { value: formatNumber(durationSeconds, 1) })
          }}</span>
        </div>
        <div class="zone-stat">
          <span class="zone-stat-label">{{ t('ui.xpPerCycle') }}</span>
          <span class="zone-stat-value">{{ formatNumber(xpPerCycle) }}</span>
        </div>
        <div class="zone-stat">
          <span class="zone-stat-label">{{ t('ui.chestPoints') }}</span>
          <span class="zone-stat-value">{{ formatNumber(chestPointsPerCycle, 2) }}</span>
        </div>
      </div>

      <div class="zone-resources">
        <section class="zone-resource">
          <h3>{{ t('ui.requiredMaterials') }}</h3>
          <ul v-if="hasIngredients">
            <li v-for="ingredient in openZone.ingredients" :key="ingredient.item.id">
              <span class="resource-name">{{ t(ingredient.item.name) }}</span>
              <span class="resource-count">×{{ formatNumber(ingredient.count) }}</span>
            </li>
          </ul>
          <p v-else class="zone-resource-empty">{{ t('nothing') }}</p>
        </section>
        <section class="zone-resource">
          <h3>{{ t('ui.rewards') }}</h3>
          <ul v-if="hasProducts">
            <li v-for="product in openZone.products" :key="product.item.id">
              <span class="resource-name">{{ t(product.item.name) }}</span>
              <span class="resource-count">×{{ formatNumber(product.count) }}</span>
            </li>
          </ul>
          <p v-else class="zone-resource-empty">{{ t('nothing') }}</p>
        </section>
      </div>

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
            type="button"
            class="zone-button primary"
            @click="addAction"
            :disabled="!allowAmount"
          >
            {{ t('start') }}
          </button>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss">
#skill-page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.skill-header {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .skill-header-main {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .skill-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.01em;
  }

  .skill-level {
    font-size: 18px;
    font-weight: 600;
    color: #2563eb;
    background: rgba(37, 99, 235, 0.12);
    padding: 4px 12px;
    border-radius: 999px;
  }

  .skill-description {
    color: #475569;
    line-height: 1.5;
    font-size: 14px;
  }

  .skill-stats {
    display: flex;
    gap: 24px;
  }

  .skill-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .skill-stat-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    font-weight: 500;
  }

  .skill-stat-value {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
  }

  .skill-progress-bar-container {
    width: 100%;
    height: 8px;
    background-color: rgba(226, 232, 240, 0.6);
    border-radius: 999px;
    overflow: hidden;

    .skill-progress-bar {
      height: 100%;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      transition: width 0.3s ease;
      box-shadow: 0 0 8px rgba(37, 99, 235, 0.4);
    }
  }
}

#skill-area-root {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-content: flex-start;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  overflow-y: auto;

  .area-item {
    width: 140px;
    height: 140px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 12px;
    text-align: center;
    user-select: none;
    cursor: pointer;
    box-sizing: border-box;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 18px 34px rgba(37, 99, 235, 0.15);
      border-color: rgba(37, 99, 235, 0.35);
    }

    .chest-progress {
      width: 100%;
      height: 6px;
      background-color: rgba(226, 232, 240, 0.9);
      border-radius: 999px;
      overflow: hidden;

      .chest-progress-bar {
        height: 100%;
        background: linear-gradient(135deg, #22d3ee 0%, #2563eb 100%);
        transition: width 0.3s ease;
      }
    }
  }
}

.zone-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: min(460px, 100%);
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.zone-header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zone-overline {
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #6b7280;
}

.zone-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.zone-description {
  margin: 0;
  color: #475569;
  line-height: 1.5;
}

.zone-close {
  border: none;
  background: rgba(148, 163, 184, 0.16);
  color: #475569;
  border-radius: 999px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 20px;
  line-height: 1;
}

.zone-close:hover {
  background: rgba(71, 85, 105, 0.22);
  color: #1f2937;
}

.zone-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.zone-stat {
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.zone-stat-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.zone-stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.zone-resources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.zone-resource {
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zone-resource h3 {
  margin: 0;
  font-size: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #1f2937;
}

.zone-resource ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zone-resource li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #0f172a;
}

.resource-name {
  font-weight: 500;
}

.resource-count {
  color: #334155;
}

.zone-resource-empty {
  margin: 0;
  font-style: italic;
  color: #94a3b8;
}

.zone-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zone-amount {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.zone-amount-label {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.zone-amount-input {
  display: flex;
  gap: 6px;
}

.zone-amount-input input {
  flex: 1;
  border: 1px solid #cbd5f5;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  color: #0f172a;
}

.zone-amount-input input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.zone-amount-infinity {
  border: none;
  border-radius: 6px;
  background: #e2e8f0;
  color: #0f172a;
  padding: 0 12px;
  cursor: pointer;
  font-size: 18px;
}

.zone-amount-infinity:hover {
  background: #cbd5f5;
}

.zone-action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.zone-button {
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.zone-button.primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
}

.zone-button.primary:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.zone-button.ghost {
  background: #e2e8f0;
  color: #1f2937;
}

.zone-button.ghost:hover {
  background: #cbd5e1;
}

@media (max-width: 540px) {
  .zone-modal {
    min-width: unset;
  }

  .zone-stats {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .zone-resources {
    grid-template-columns: 1fr;
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
