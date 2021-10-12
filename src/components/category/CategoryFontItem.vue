<template lang="pug">
  div(class="category-fonts pointer" draggable="false" @click="setFont()")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="`${host}/${objectId}/${preview}`"
        @error="handleNotFound")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="`${host}/${objectId}/${preview2}`"
        @error="handleNotFound")
    div(v-if="props.font === objectId" class="category-fonts__done-icon")
      svg-icon(:iconName="'done'"
        :iconColor="'gray-2'"
        :iconWidth="'25px'")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import TextPropUtils from '@/utils/textPropUtils'
import StepsUtils from '@/utils/stepsUtils'
import { IFont } from '@/interfaces/text'

export default Vue.extend({
  props: {
    host: String,
    objectId: String,
    preview: String,
    preview2: String
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'fontStore'])
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    async setFont() {
      const fontStore = this.fontStore as Array<IFont>
      if (!fontStore.some(font => font.face === this.objectId)) {
        const newFont = new FontFace(this.objectId, this.getFontUrl(this.objectId))
        const promise = () => {
          return new Promise<void>((resolve) => {
            newFont.load().then(newFont => {
              document.fonts.add(newFont)
              TextUtils.updateFontFace({ name: newFont.family, face: newFont.family })
              StepsUtils.record()
              resolve()
            })
          })
        }
        await promise()
      }
      TextPropUtils.onPropertyClick('fontFamily', this.objectId, this.sel.start, this.sel.end)
      TextPropUtils.updateTextPropsState({ font: this.objectId })
    },
    getFontUrl(fontID: string): string {
      console.log(fontID)
      return `url("https://template.vivipic.com/font/${fontID}/font")`
    }
  }
})
</script>

<style lang="scss" scoped>
  .category-fonts {
    display: grid;
    grid-template-columns: 7fr 4fr 1fr;
    grid-gap: 10px;
    &__item-wrapper {
      overflow: hidden;
      position: relative;
      text-align: left;
    }
    &__item {
    height: 25px;
    object-fit: contain;
    }
    &__done-icon {
      position: absolute;
      right: 0;
    }
  }
</style>
