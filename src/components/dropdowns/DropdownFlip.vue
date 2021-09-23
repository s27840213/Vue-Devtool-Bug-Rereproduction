<template lang="pug">
  div(class="dropdown dropdown__flip bg-white")
    div(v-for="(data,index) in dropdownDatas()"
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
    dropdownDatas() {
      const icons = ['flip-h', 'flip-v']
      const texts = ['水平翻轉', '垂直翻轉']
      return icons.map((icon: string, index: number) => {
        return {
          icon: icons[index],
          text: texts[index],
          action: MappingUtils.mappingIconAction(icon)
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
