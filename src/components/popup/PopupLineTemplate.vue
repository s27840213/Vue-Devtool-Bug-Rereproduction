<template lang="pug">
  div(class="popup-line-template bg-white")
    div(class="popup-line-template__group")
      div(class="body-3")
        span 選擇標線版型
      div(class="text-gray-3")
        span line推播支援
      div
        div(class="popup-line-template__grid")
          div(v-for="(template,index) in lineTemplate1"
              :key="`line-template-1-${index}`"
              class="popup-line-template__item"
              @click="addLineTemplate(index,LineTemplatesType.type1)")
            svg-icon(
              class="popup-line-template__icon pointer"
              :iconName="template"
              :iconWidth="'60px'"
              :iconColor="'gray-1'")
        hr(class="popup-line-template__hr")
        div(class="popup-line-template__grid")
          div(v-for="(template,index) in lineTemplate2"
              :key="`line-template-2-${index}`"
              class="popup-line-template__item"
              @click="addLineTemplate(index,LineTemplatesType.type2)")
            svg-icon(
              class="popup-line-template__icon pointer"
              :iconName="template"
              :iconWidth="'65px'"
              :iconColor="'gray-1'")
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters } from 'vuex'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import rulerUtils from '@/utils/rulerUtils'
import popupUtils from '@/utils/popupUtils'
import { LineTemplatesType } from '@/store/types'

export default Vue.extend({
  data() {
    return {
      MappingUtils,
      lineTemplate1: [] as Array<string>,
      lineTemplate2: [] as Array<string>,
      LineTemplatesType
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
    const tmp = this.mappingIcons('lineTemplate')
    this.lineTemplate1 = tmp.slice(0, 8)
    this.lineTemplate2 = tmp.slice(8)
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    addLineTemplate(index: number, type: LineTemplatesType) {
      console.log(type)
      rulerUtils.addLineTemplate(index, type)
      popupUtils.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-line-template {
  padding: 0.375rem 0.625rem;
  border-radius: 50%;
  &__group {
    // heading
    > div:nth-child(1) {
      display: flex;
      justify-content: center;
      margin-bottom: 4px;
      > span {
        letter-spacing: 0.655em;
        padding-left: 0.655em;
        text-align: center;
      }
      > span {
        letter-spacing: 0.655em;
        padding-left: 0.655em;
        text-align: center;
      }
    }
    > div:nth-child(2) {
      display: flex;
      justify-content: flex-start;
      margin-left: 16px;
      > span {
        font-size: 0.65rem;
      }
    }
    > div:nth-child(3) {
      display: flex;
      flex-direction: column;
    }
  }

  &__grid {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(4, 1fr);
    column-gap: 1.25rem;
    row-gap: 1.875rem;
    padding: 1rem 0;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__icon::v-deep {
    stroke: #969bab;
    transition: stroke 0.1s ease-in, stroke-width 0.1s ease-in;
    &:hover {
      stroke: setColor(blue-1);
      stroke-width: 2px;
    }
  }
  &__hr {
    margin: 0.375rem 0;
    border: none;
    border-bottom: 1px solid setColor(gray-4);
    width: 100%;
  }
}
</style>
