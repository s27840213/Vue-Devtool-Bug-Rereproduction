<template lang="pug">
  div(class="panel-order bg-white")
    div(v-for="(data,index) in orderDatas()"
        :key="`popup-${index}`"
        class="panel-order__item"
        @click="data.action()")
      svg-icon(
        class="pointer"
        :iconName="data.icon"
        :iconWidth="'16px'"
        :iconColor="'gray-1'")
      span(class="ml-5 body-2") {{data.text}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters } from 'vuex'
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
    orderDatas() {
      const orderSet = [
        {
          icon: 'layers-forward',
          text: this.$t('NN0232')
        },
        {
          icon: 'layers-front',
          text: this.$t('NN0231')
        },
        {
          icon: 'layers-backward',
          text: this.$t('NN0233')
        },
        {
          icon: 'layers-back',
          text: this.$t('NN0234')
        }]
      return orderSet.map((data) => {
        return {
          icon: data.icon,
          text: data.text,
          action: MappingUtils.mappingIconAction(data.icon)
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-order {
  width: 100%;
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 16px;
  row-gap: 16px;
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
