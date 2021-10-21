<template lang="pug">
  div(class="popup-line-template bg-white")
    div(class="popup-line-template__group")
      div(class="body-3")
        span 選擇標線版型
      div(class="text-gray-3")
        span line推播支援
      div
        div(v-for="(template,index) in templates"
            :key="`popup-${index}`"
            class="popup-line-template__item"
            @click="addLineTemplate(index)")
          svg-icon(
            class="pointer"
            :iconName="template"
            :iconWidth="'60px'"
            :iconColor="'gray-1'")
    //- hr(v-if="layerNum >=3" class="popup-line-template__hr")
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapMutations } from 'vuex'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import rulerUtils from '@/utils/rulerUtils'
import popupUtils from '@/utils/popupUtils'

export default Vue.extend({
  data() {
    return {
      MappingUtils,
      templates: [] as Array<string>
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
  mounted() {
    this.templates = this.mappingIcons('lineTemplate')
    console.log(this.templates)
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    addLineTemplate(index: number) {
      rulerUtils.addLineTemplate(index)
      popupUtils.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-line-template {
  padding: 0.375rem 0.625rem;
  &__group {
    // heading
    > div:nth-child(1) {
      display: flex;
      justify-content: center;
      margin-bottom: 0.2rem;
    }
    > div:nth-child(2) {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 0.4rem;
      > span {
        font-size: 0.65rem;
      }
    }
    > div:nth-child(3) {
      display: grid;
      grid-auto-rows: auto;
      grid-template-columns: repeat(4, 1fr);
      column-gap: 0.5rem;
      row-gap: 0.5rem;
      > div {
        display: flex;
        flex-direction: column;
      }
    }
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.1s ease-in;
    padding: 0.125rem 0.125rem;
    border-radius: 0.25rem;
    box-sizing: border-box;
    &:hover {
      background-color: setColor(blue-3, 0.5);
    }
    &:active {
      background-color: setColor(blue-1, 0.5);
    }
  }
}
</style>
