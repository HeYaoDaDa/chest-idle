<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue'
import { INFINITE_STRING } from '@/constants'
import type { ActionTarget } from '@/models/actionTarget'
import { actionManager } from '@/models/global/ActionManager'
import { dataManager } from '@/models/global/DataManager'
import { isIntegerOrInfinity, stringToNumber } from '@/utils'
import { Tooltip } from 'floating-vue'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const skillId = ref(route.params.id as string)
onBeforeRouteUpdate(async (to) => {
  skillId.value = to.params.id as string
})

const skill = computed(() => dataManager.getSkillById(skillId.value))

const openZone = shallowRef(undefined as ActionTarget | undefined);
const amountString = ref(INFINITE_STRING);
const allowAmount = computed(() => isIntegerOrInfinity(amountString.value));
function openModal(zone: ActionTarget) {
  openZone.value = zone
}
function closeModal() {
  openZone.value = undefined
  amountString.value = '∞'
}
function addAction() {
  if (openZone.value) {
    actionManager.addAction(openZone.value, stringToNumber(amountString.value));
    openZone.value = undefined;
  } else {
    console.error('openZone is null')
  }
}
</script>

<template>
  <div id="skill-area-root">
    <Tooltip v-for="zone in skill.actionTargets" :key="zone.id">
      <div @click="openModal(zone)" class="area-item">
        <div>{{ t(zone.name) }}</div>
        <div class="chest-progress">
          <div class="chest-progress-bar" :style="{
            width: (zone.chest.points.value / zone.chest.maxPoints * 100) + '%'
          }"></div>
        </div>
      </div>
      <template #popper>
        <div>
          {{ t(zone.description) }}
        </div>
      </template>
    </Tooltip>
  </div>
  <ModalBox v-if="openZone" @close="closeModal">
    <div id="area-modal-box">
      <div>{{ t(openZone.name) }}</div>
      <div>{{ t(openZone.skill.name) }}</div>
      <div>{{ t(openZone.description) }}</div>
      <div>{{ t('minLevelRequired') }}: {{ openZone.minLevel }}</div>
      <div>{{ t('duration') }}: {{ openZone.duration.value / 1000 }}s</div>
      <div v-for="(ingredient, index) in openZone.ingredients" :key="index">
        {{ t(ingredient.item.name) }}: {{ ingredient.count }}
      </div>
      <div v-for="(product, index) in openZone.products" :key="index">
        {{ t(product.item.name) }}: {{ product.count }}
      </div>
      <div>
        <input type="text" v-model="amountString" />
        <button @click="amountString = '∞'">∞</button>
      </div>
      <button @click="addAction()" :disabled="!allowAmount">{{ t('start') }}</button>
    </div>
  </ModalBox>
</template>

<style lang="scss">
@use 'sass:color';

#skill-area-root {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-content: flex-start;
  align-items: flex-start;
  gap: 10px;

  .area-item {
    min-width: 100px;
    min-height: 100px;
    background-color: color.adjust(white, $lightness: -10%);

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    user-select: none;
    cursor: pointer;

    .chest-progress {
      width: 80%;
      height: 4px;
      background-color: color.adjust(black, $alpha: -0.9);
      margin-top: 8px;
      border-radius: 2px;
      overflow: hidden;

      .chest-progress-bar {
        height: 100%;
        background-color: black;
        transition: width 0.3s ease;
      }
    }
  }
}

#area-modal-box {
  display: flex;
  flex-flow: column nowrap;
  padding: 8px;
  gap: 4px;
}
</style>
