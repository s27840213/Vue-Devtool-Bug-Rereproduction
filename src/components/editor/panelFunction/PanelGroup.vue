<template lang="pug">
  div(class="panel-group")
    btn(v-show="currSelectedInfo.layers.length>1"
      class="full-width"
      :type="'primary-lg'"
      @click.native=" isGroup()? ShortcutUtils.ungroup(): ShortcutUtils.group()") {{isGroup()?'Ungroup':'Group'}}
    action-bar(class="flex-between")
      svg-icon(v-for="(icon,index) in mappingIcons('align')"
        :key="`align-icon-${index}`"
        class="pointer"
        :iconName="icon" :iconWidth="'24px'" :iconColor="'gray-2'"
        @click.native="iconAction(icon)")
    action-bar(class="flex-between")
      svg-icon(v-for="(icon,index) in mappingIcons('action')"
        :key="`gp-action-icon-${index}`"
        class="pointer"
        :class="{'layers-alt': icon==='layers-alt'}"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'"
        @click.native="iconAction(icon)")
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import GroupUtils from '@/utils/groupUtils'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  data() {
    return {
      ShortcutUtils,
      GroupUtils
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo'
    })
  },
  methods: {
    ...mapMutations({
      setIsOrderDropdownsOpened: 'SET_isOrderDropdownsOpened'
    }),
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    iconAction(icon: string) {
      MappingUtils.mappingIconAction(icon)
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
