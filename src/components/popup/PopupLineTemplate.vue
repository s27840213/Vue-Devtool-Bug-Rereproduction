<template lang="pug">
div(class="popup-line-template bg-white")
  div(class="popup-line-template__group")
    div(class="body-3")
      span {{$t('NN0501')}}
    div(class="popup-line-template__options")
      span(class="popup-line-template__subtitle text-gray-3 mb-5") {{$t('NN0152', {media: 'Line'})}}
      div(class="popup-line-template__grid-4")
        svg-icon(v-for="(template,index) in lineTemplate1"
            :key="`line-template-1-${index}`"
            class="popup-line-template__icon pointer"
            :iconName="template"
            :iconWidth="'80px'"
            :iconColor="'gray-1'"
            @click="addLineTemplate(index,LineTemplatesType.type1)")
    hr(class="popup-line-template__hr")
    div(class="popup-line-template__row2" :style="row2Styles")
      div(v-if="isFbCover" class="popup-line-template__fb-cover")
        span(class="popup-line-template__subtitle text-gray-3 mb-5") {{$tc('NN0151', 2,{ media: 'FB' })}}
        div
          svg-icon(class="popup-line-template__icon pointer"
            :iconName="'line-template-fb-cover'"
            :iconWidth="'80px'"
            :iconColor="'gray-1'"
            @click="addLineToSpecPos(fbCover)")
      div(class="popup-line-template__options")
        span(class="popup-line-template__subtitle text-gray-3 mb-5") {{$t('NN0452')}}
        div(class="popup-line-template__grid-3")
          svg-icon(v-for="(template,index) in lineTemplate2"
              :key="`line-template-2-${index}`"
              class="popup-line-template__icon pointer"
              :iconName="template"
              :iconWidth="'80px'"
              :iconColor="'gray-1'"
              @click="addLineTemplate(index,LineTemplatesType.type2)")
</template>

<script lang="ts">
import { ICurrSelectedInfo } from '@/interfaces/editor'
import { IPage } from '@/interfaces/page'
import { LineTemplatesType } from '@/store/types'
import MappingUtils from '@/utils/mappingUtils'
import popupUtils from '@/utils/popupUtils'
import rulerUtils from '@/utils/rulerUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  data() {
    const tmp = MappingUtils.mappingIconSet('lineTemplate')
    const lineTemplate1 = tmp.slice(0, 8)
    const lineTemplate2 = tmp.slice(8)
    const fbCover = rulerUtils.fbCover
    return {
      MappingUtils,
      lineTemplate1,
      lineTemplate2,
      LineTemplatesType,
      fbCover
    }
  },
  props: {
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
    layerNum(): number {
      return (this.currSelectedInfo as ICurrSelectedInfo).layers.length
    },
    isFbCover(): boolean {
      const { width, height } = this.currPage
      return width === 1230 && height === 693
    },
    row2Styles(): {[index: string]: string} {
      return {
        'grid-template-columns': this.isFbCover ? '0.25fr 0.75fr' : '0.75fr 0.25fr'
      }
    }
  },
  methods: {
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    addLineTemplate(index: number, type: LineTemplatesType) {
      rulerUtils.addLineTemplate(index, type)
      popupUtils.closePopup()
    },
    addLineToSpecPos(posObj: { v: Array<number>, h: Array<number> }) {
      rulerUtils.addToSpecPos(posObj)
      popupUtils.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-line-template {
  padding: 28px 21px;
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
    }
    > div:nth-child(2) {
      display: flex;
      justify-content: flex-start;
    }
    > div:nth-child(3) {
      display: flex;
      flex-direction: column;
    }
  }

  &__grid-4 {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(4, auto);
    column-gap: 25px;
    row-gap: 25px;
  }

  &__grid-3 {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: repeat(3, auto);
    column-gap: 25px;
  }

  &__row2 {
    display: grid;
    grid-template-rows: auto;
    column-gap: 25px;
  }

  &__options {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  &__fb-cover {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  &__subtitle {
    font-size: 12px;
    text-align: left;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1/1;
  }
  &__icon {
    stroke: #969bab;
    transition: stroke 0.1s ease-in, stroke-width 0.1s ease-in;
    &:hover {
      stroke: setColor(blue-1);
      stroke-width: 2px;
    }
  }
  &__hr {
    margin: 16px 0;
    border: none;
    border-bottom: 1px solid setColor(gray-4);
    width: 100%;
  }
}
</style>
