<template lang="pug">
  div(class="dropdown dropdown__order bg-white")
    div(v-for="(data,index) in dropdownDatas('order')"
        :key="`dropdown-${index}`"
        class="dropdown__item"
        @click="data.action")
      svg-icon(
        class="pointer"
        :iconName="data.icon"
        :iconWidth="'12px'"
        :iconColor="'gray-1'")
      span(class="ml-5 body-2") {{data.text}}
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'

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
    }
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    mappingText(type: string): string[] {
      switch (type) {
        case 'order': {
          return [
            '置前',
            '移至最前',
            '置後',
            '移至最後'
          ]
        }
        case 'layer': {
          return [
            'Copy',
            'Paste',
            'Delete'
          ]
        }
        default: {
          return []
        }
      }
    },
    dropdownDatas(type: string) {
      const icons = this.mappingIcons(type)
      const texts = this.mappingText(type)
      return icons.map((icon: string, index: number) => {
        return {
          icon: icon,
          text: texts[index],
          action: MappingUtils.mappingIconAction(icon)
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.dropdown__order {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: auto auto;
  column-gap: 0.5rem;
}
</style>
