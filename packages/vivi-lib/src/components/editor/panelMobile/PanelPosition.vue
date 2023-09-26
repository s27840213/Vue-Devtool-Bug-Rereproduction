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
import MappingUtils from '@/utils/mappingUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  data() {
    return {
      MappingUtils
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
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
    @include btn-action-mobile;
  }
}
</style>
