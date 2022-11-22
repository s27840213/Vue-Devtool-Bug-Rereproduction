<template lang="pug">
  div(class="popup-flip")
    div(v-for="(data,index) in popupDatas()"
        :key="`popup-${index}`"
        class="popup-flip__item"
        @click="MappingUtils.mappingIconAction(data.icon)")
      svg-icon(
        class="pointer"
        :iconName="data.icon"
        :iconWidth="'12px'"
        :iconColor="'gray-1'")
      span(class="ml-5 body-2") {{data.text}}
</template>

<script lang="ts">
import { LayerType } from '@/store/types'
import layerUtils from '@/utils/layerUtils'
import MappingUtils from '@/utils/mappingUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      MappingUtils,
      destoryCb: undefined as unknown as (() => void | undefined)
    }
  },
  mounted() {
    const target = layerUtils.getCurrConfig
    if (target.type === LayerType.image) {
      const el = document.getElementById(`nu-image-${target.id}__shadow`)
      if (el) {
        el.classList.add('layer-flip')
        this.destoryCb = () => {
          el.classList.remove('layer-flip')
        }
      }
    }
  },
  unmounted() {
    this.destoryCb && this.destoryCb()
  },
  methods: {
    popupDatas() {
      const icons = ['flip-h', 'flip-v']
      const texts = [`${this.$t('NN0053')}`, `${this.$t('NN0054')}`]
      return icons.map((icon: string, index: number) => {
        return {
          icon: icons[index],
          text: texts[index]
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-flip {
  &__item {
    display: flex;
    align-items: center;
    transition: background-color 0.1s ease-in;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    &:hover {
      background-color: setColor(blue-3, 0.5);
    }
    &:active {
      background-color: setColor(blue-3);
    }
    > span {
      font-size: 0.75rem;
    }
  }
}
</style>
