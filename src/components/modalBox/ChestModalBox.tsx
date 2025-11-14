import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import ModalBox from '@/components/ModalBox'
import { itemConfigMap } from '@/gameConfig'
import { useChestPointStore } from '@/stores/chestPoint'
import { formatNumber, formatPercent } from '@/utils/format'

export default defineComponent({
  name: 'ChestModalBox',
  props: {
    modelValue: { type: Boolean, required: true },
    chestId: { type: String, default: null },
  },
  emits: ['update:modelValue', 'close'],
  setup(props, { emit }) {
    const { t, locale } = useI18n()
    const chestPointStore = useChestPointStore()

    const chest = computed(() => {
      if (!props.chestId) return null
      return itemConfigMap[props.chestId]
    })

    const chestPoints = computed(() => {
      if (!chest.value) return 0
      return chestPointStore.getChestPoints(chest.value.id)
    })

    const chestProgress = computed(() => {
      if (!chest.value) return 0
      return chestPointStore.getChestProgress(chest.value.id)
    })

    const chestRemaining = computed(() => {
      if (!chest.value) return 0
      return chestPointStore.getChestRemaining(chest.value.id)
    })

    const lootWithProbability = computed(() => {
      if (!chest.value || !chest.value.chest) return []

      return chest.value.chest.loots.map((lootEntry) => ({
        itemId: lootEntry.itemId,
        minCount: lootEntry.min,
        maxCount: lootEntry.max,
        probability: lootEntry.chance * 100,
      }))
    })

    const closeModal = () => {
      emit('update:modelValue', false)
      emit('close')
    }

    return () => {
      if (!props.modelValue || !chest.value) return null

      return (
        <ModalBox onClose={closeModal}>
          <div class="flex flex-col gap-6 min-w-[min(460px,100%)]">
            {/* Header */}
            <div class="flex justify-between items-start gap-4">
              <div class="flex flex-col gap-2">
                <span class="text-xs uppercase tracking-wider text-gray-500">{t('ui.chest')}</span>
                <h2 class="text-3xl font-bold text-gray-900 leading-tight">
                  {t(chest.value.name)}
                </h2>
                <p class="text-gray-600 leading-relaxed">{t(chest.value.description)}</p>
              </div>
              <button
                type="button"
                class="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 text-2xl leading-none transition-colors"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            {/* Info List */}
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center py-2">
                <span class="text-sm font-medium text-gray-700">{t('ui.currentProgress')}</span>
                <span class="text-sm text-gray-900">
                  {formatNumber(chestPoints.value, locale.value, 3)} /{' '}
                  {formatNumber(chest.value.chest?.maxPoints || 0, locale.value, 3)}
                </span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm font-medium text-gray-700">{t('ui.progressPercentage')}</span>
                <span class="text-sm text-gray-900">
                  {formatPercent(chestProgress.value * 100, locale.value, 3)}
                </span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm font-medium text-gray-700">{t('ui.remainingPoints')}</span>
                <span class="text-sm text-gray-900">
                  {formatNumber(chestRemaining.value, locale.value, 3)}
                </span>
              </div>

              <div class="h-px bg-gray-200 my-2"></div>

              <div class="flex justify-between items-center py-2 font-semibold">
                <span class="text-sm text-gray-700">{t('ui.possibleRewards')}</span>
              </div>

              {/* Loot List */}
              <div class="flex flex-col gap-3 mt-2">
                {lootWithProbability.value.map((loot, index) => (
                  <div
                    key={index}
                    class="flex flex-col gap-1 p-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 hover:border-blue-300 transition-all"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-semibold text-gray-900 text-sm">
                        {t(`item.${loot.itemId}.name`)}
                      </span>
                      <span class="text-xs text-gray-600 font-medium">
                        ×
                        {loot.minCount === loot.maxCount
                          ? formatNumber(loot.minCount, locale.value, 3)
                          : `${formatNumber(loot.minCount, locale.value, 3)}-${formatNumber(
                              loot.maxCount,
                              locale.value,
                              3,
                            )}`}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-xs">
                      <span class="text-gray-500">{t('ui.dropChance')}:</span>
                      <span class="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                        {formatPercent(loot.probability, locale.value, 3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalBox>
      )
    }
  },
})
