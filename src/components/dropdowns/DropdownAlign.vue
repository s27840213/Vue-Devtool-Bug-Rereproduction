<template lang="pug">
  div(class="dropdown dropdown__align bg-white")
    div(class="dropdown__group")
      div
        span 元件對齊
      div
        div(v-for="(data,index) in alignDatas()"
            :key="`dropdown-${index}`"
            class="dropdown__item"
            @click="MappingUtils.mappingIconAction(data.icon)")
          svg-icon(
            class="pointer"
            :iconName="data.icon"
            :iconWidth="'16px'"
            :iconColor="'gray-1'")
          span(class="ml-5 body-2") {{data.text}}
    hr(v-if="layerNum >=3" class="dropdown__hr")
    div(v-if="layerNum >=3" class="dropdown__group")
      div
        span 平均分配間距
      div
        div(v-for="(data,index) in distributeDatas()"
            :key="`dropdown-${index}`"
            class="dropdown__item"
            @click="MappingUtils.mappingIconAction(data.icon)")
          svg-icon(
            class="pointer"
            :iconName="data.icon"
            :iconWidth="'16px'"
            :iconColor="'gray-1'")
          span(class="ml-5 body-2") {{data.text}}
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import { ICurrSelectedInfo } from '@/interfaces/editor'

export default Vue.extend({
  props: {
    hasImage: {
      type: Boolean,
      default: true
    },
    type: String,
    datas: Array
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
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
      const texts = ['靠左', '水平置中', '靠右', '靠上', '垂直置中', '靠下']
      return icons.map((icon: string, index: number) => {
        return {
          icon: icon,
          text: texts[index]
        }
      })
    },
    distributeDatas() {
      const icons = this.mappingIcons('distribute')
      const texts = ['水平分布', '垂直分布']
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
.dropdown {
  &__group {
    // heading
    > div:nth-child(1) {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 0.5rem;
      > span {
        font-size: 0.75rem;
      }
    }
    > div:nth-child(2) {
      display: grid;
      grid-auto-rows: auto;
      grid-template-columns: repeat(3, 1fr);
      column-gap: 0.5rem;
      row-gap: 0.5rem;
      > div {
        display: flex;
        flex-direction: column;
      }
    }
  }
}
</style>
