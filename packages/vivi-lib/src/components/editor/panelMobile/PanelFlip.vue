<template lang="pug">
div(v-if="!$isCm" class="panel-flip")
  div(v-for="(data,index) in flipData"
      :key="`popup-${index}`"
      class="panel-flip__item"
      @click="handleFlipAction(data)")
    svg-icon(
      class="pointer"
      :iconName="data.icon"
      :iconWidth="'12px'"
      :iconColor="($isStk || $isCm) ? 'white' : 'gray-1'")
    span(class="ml-5 body-2") {{data.text}}
div(v-else class="panel-flip")
  svg-icon(
    v-for="flip in flipData"
    :key="flip.icon"
    class="pointer"
    iconName="cm_flip-h"
    iconWidth="24px"
    :iconColor="($isStk || $isCm) ? 'white' : 'gray-1'"
    @click="handleFlipAction(flip)")
</template>

<script lang="ts">
import { ICurrSelectedInfo } from '@/interfaces/editor'
import backgroundUtils from '@/utils/backgroundUtils'
import MappingUtils from '@/utils/mappingUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
    layerNum(): number {
      return (this.currSelectedInfo as ICurrSelectedInfo).layers.length
    },
    flipData() {
      return [{
        icon: 'flip-h',
        text: this.$t('NN0053'),
      }, {
        icon: 'flip-v',
        text: this.$t('NN0054'),
      }]
    },
  },
  methods: {
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
    @include btn-action-mobile;
  }

  @include cm {
    display: flex;
    justify-content: center;
    gap: 64px;
    padding: 8px;
    background-color: setColor(lighter, 0.2);
    border-radius: 8px;
    > .svg-icon:nth-child(2) {
      transform: rotate(90deg);
    } 
  };
}
</style>
