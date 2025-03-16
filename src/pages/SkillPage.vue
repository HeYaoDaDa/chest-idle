<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue'
import { global } from '@/global'
import { Amount } from '@/model/common/Amount'
import { useActionStore } from '@/stores/action'
import { type AreaInterface } from '@/global'
import { Tooltip } from 'floating-vue'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'

const route = useRoute()
const skillId = ref(route.params.id as string)
onBeforeRouteUpdate(async (to) => {
  skillId.value = to.params.id as string
})

const { t } = useI18n()
const skill = computed(() =>
  skillId.value === 'woodcutting' ? global.woodcuttingSkill : global.miningSkill,
)

const actionStore = useActionStore()
const openArea = shallowRef(undefined as AreaInterface | undefined)
const amount = ref('∞')
const allowStart = computed(() => Amount.verify(amount.value))
function openModal(area: AreaInterface) {
  openArea.value = area
}
function closeModal() {
  openArea.value = undefined
  amount.value = '∞'
}
function addAction() {
  if (openArea.value) {
    actionStore.addAction(openArea.value, Amount.from(amount.value))
    openArea.value = undefined
  } else {
    console.error('openArea is null')
  }
}
</script>

<template>
  <div id="skill-area-root">
    <Tooltip v-for="area in skill.areas" :key="area.id" theme="item-tooltip">
      <div @click="openModal(area)" class="area-item">
        <div>{{ area.name() }}</div>
      </div>
      <template #popper>
        <div>
          {{ area.description() }}
        </div>
      </template>
    </Tooltip>
  </div>
  <ModalBox v-if="openArea" @close="closeModal">
    <div id="area-modal-box">
      <div>{{ openArea.name() }}</div>
      <div>{{ openArea.skill.name() }}</div>
      <div>{{ openArea.description() }}</div>
      <div>{{ openArea.baseTime / 1000 }}s</div>
      <div v-for="(loot, index) in openArea.products" :key="index">
        {{ loot.percentage }}% {{ loot.item.getName() }}: {{ loot.min }}-{{ loot.max }}
      </div>
      <div>
        <input type="text" v-model="amount" />
        <button @click="amount = '∞'">∞</button>
      </div>
      <button @click="addAction()" :disabled="!allowStart">{{ t('start') }}</button>
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
    justify-content: center;
    align-items: center;
    user-select: none;
    cursor: pointer;
  }
}

#area-modal-box {
  display: flex;
  flex-flow: column nowrap;
  padding: 8px;
  gap: 4px;
}
</style>
