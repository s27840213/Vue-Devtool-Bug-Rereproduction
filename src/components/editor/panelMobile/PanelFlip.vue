<template lang="pug">
div(class="panel-flip bg-white")
  div(v-for="(data,index) in flipData()"
      :key="`popup-${index}`"
      class="panel-flip__item"
      @click="handleFlipAction(data)")
    svg-icon(
      class="pointer"
      :iconName="data.icon"
      :iconWidth="'12px'"
      :iconColor="'gray-1'")
    span(class="ml-5 body-2") {{data.text}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters } from 'vuex'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import backgroundUtils from '@/utils/backgroundUtils'

export default defineComponent({
  data() {
    return {
      MappingUtils
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
    layerNum(): number {
      return (this.currSelectedInfo as ICurrSelectedInfo).layers.length
    }
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    flipData() {
      const icons = ['flip-h', 'flip-v']
      const texts = [`${this.$t('NN0053')}`, `${this.$t('NN0054')}`]
      return icons.map((icon: string, index: number) => {
        return {
          icon: icons[index],
          text: texts[index]
        }
      })
    },
    handleFlipAction(data: { icon: string, text: string }) {
      if (this.layerNum > 0) {
        MappingUtils.mappingIconAction(data.icon)
      } else if (backgroundUtils.inBgSettingMode) {
        backgroundUtils.handleImageFlip(data.icon)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-flip {
  width: 100%;
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 16px;
  padding-bottom: 16px;
  &__item {
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.1s ease-in;
    padding: 8px 16px;
    border-radius: 0.25rem;
    background-color: setColor(gray-5);
  }
}
</style>
