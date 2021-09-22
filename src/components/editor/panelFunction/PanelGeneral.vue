<template lang="pug">
  div(class="panel-group mb-10")
    div(class="panel-group__group-ctrl")
      btn(class="full-width mr-10 rounded"
        :type="'primary-mid'"
        :disabled="isLocked || (!isGroup && selectedLayerNum <=1)"
        @click.native="isGroup? ShortcutUtils.ungroup(): ShortcutUtils.group()") {{isGroup?'消取群組':'群組'}}
      div(class="border-gray-4 p-10")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'18px'" :iconColor="'gray-2'")
    div(class="action-bar flex-between")
      svg-icon(v-for="(icon,index) in mappingIcons('align')"
        :key="`align-icon-${index}`"
        :class="{'pointer': !isLocked}"
        :iconName="icon" :iconWidth="'24px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
        @click.native="iconAction(icon)")
    div(class="action-bar flex-between")
      svg-icon(class="layers-alt"
        :class="{'pointer': !isLocked}"
        iconName="layers-alt" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
        @click.native="openOrderDropdown()")
      svg-icon(:class="{'pointer': !isLocked}"
        iconName="copy" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
        @click.native="iconAction('copy')")
      svg-icon(class="pointer"
        :iconName="isLocked ? 'unlock' : 'lock'" :iconWidth="'20px'" :iconColor="'gray-2'"
        @click.native="iconAction('unlock')")
      svg-icon(:class="{'pointer': !isLocked}"
        iconName="trash" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
        @click.native="iconAction('trash')")
      svg-icon(:class="{'pointer': !isLocked}"
        iconName="brush" :iconWidth="'20px'" :iconColor="isLocked ? 'gray-4' : 'gray-2'"
        @click.native="")
    div(class="panel-group__adjust")
      btn(class="full-width" :type="'gray-mid'") 裁切
      btn(class="btn-align full-width" :type="'gray-mid'"
        @click.native="openAlignDropdown") 位置對齊
      btn(class="btn-flip full-width" :type="'gray-mid'"
        @click.native="openFlipDropdown") 翻轉
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import GroupUtils from '@/utils/groupUtils'
import { mapGetters, mapMutations } from 'vuex'
import LayerUtils from '@/utils/layerUtils'
import dropdownUtils from '@/utils/dropdownUtils'

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
    }),
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return LayerUtils.getTmpLayer().locked
    },
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    isGroupBtnDisable(): boolean {
      return this.isLocked || (!this.isGroup && this.selectedLayerNum <= 1)
    }
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    iconAction(icon: string) {
      MappingUtils.mappingIconAction(icon)
    },
    openOrderDropdown() {
      dropdownUtils.openOrderDropdown()
    },
    openAlignDropdown() {
      dropdownUtils.openAlignDropdown()
    },
    openFlipDropdown() {
      dropdownUtils.openFlipDropdown()
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
  &__group-ctrl {
    display: flex;
    justify-content: space-between;
    > div:nth-child(2) {
      @include flexCenter;
      aspect-ratio: 1/1;
    }
  }

  &__adjust {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(2, 1fr);
    row-gap: 10px;
    column-gap: 20px;
    > button:nth-child(1) {
      grid-column-start: 1;
      grid-column-end: 3;
    }
  }
}
</style>
