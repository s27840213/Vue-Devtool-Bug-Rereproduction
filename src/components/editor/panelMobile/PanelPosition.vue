<template lang="pug">
div(class="panel-position bg-white")
  div(v-for="(data,index) in alignDatas()"
      :key="`popup-${index}`"
      class="panel-position__item"
      @click="MappingUtils.mappingIconAction(data.icon)")
    svg-icon(
      class="pointer"
      :iconName="data.icon"
      :iconWidth="'18px'"
      :iconColor="'gray-1'")
    span(class="ml-5 body-2") {{data.text}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapMutations } from 'vuex'
import { ICurrSelectedInfo } from '@/interfaces/editor'

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
    alignDatas() {
      const icons = this.mappingIcons('align')
      const texts = [`${this.$t('NN0046')}`, `${this.$t('NN0047')}`, `${this.$t('NN0048')}`, `${this.$t('NN0049')}`, `${this.$t('NN0050')}`, `${this.$t('NN0051')}`]

      return icons.map((icon: string, index: number) => {
        return {
          icon: icon,
          text: texts[index]
        }
      })
    },
    distributeDatas() {
      const icons = this.mappingIcons('distribute')
      const texts = [`${this.$t('NN0221')}`, `${this.$t('NN0222')}`]
      return icons.map((icon: string, index: number) => {
        return {
          icon: icon,
          text: texts[index]
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-position {
  width: 100%;
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: repeat(3, 1fr);
  row-gap: 16px;
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
