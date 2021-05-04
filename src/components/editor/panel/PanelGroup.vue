<template lang="pug">
  div(class="panel-group")
    btn(class="full-width" :type="'primary-lg'") Group
    action-bar(class="flex-between")
      svg-icon(v-for="(icon,index) in mappingIcons('align')"
        :key="`align-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'24px'" :iconColor="'gray-2'")
    action-bar(class="flex-between")
      svg-icon(v-for="(icon,index) in mappingIcons('action')"
        :key="`gp-action-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'")
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'

export default Vue.extend({
  methods: {
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-group {
  display: flex;
  flex-direction: column;
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
}
</style>
