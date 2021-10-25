<template lang="pug">
  div(class="category-fonts pointer" draggable="false" @click="setFont()")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="`${host}/${item.id}/${preview}`"
        @error="handleNotFound")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="`${host}/${item.id}/${preview2}`"
        @error="handleNotFound")
    div(v-if="props.font === item.id" class="category-fonts__done-icon")
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
import AssetUtils from '@/utils/assetUtils'

export default Vue.extend({
  props: {
    host: String,
    preview: String,
    preview2: String,
    item: Object
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'fontStore'])
  },
  mounted() {
    console.log(this.item)
  },
  methods: {
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    async setFont() {
      const fontStore = this.fontStore as Array<IFont>
      if (!fontStore.some(font => font.face === this.item.id)) {
        const newFont = new FontFace(this.item.id, this.getFontUrl(this.item.id))
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
      AssetUtils.addAssetToRecentlyUsed(this.item)
      TextPropUtils.onPropertyClick('fontFamily', this.item.id, this.sel.start, this.sel.end)
      TextPropUtils.updateTextPropsState({ font: this.item.id })
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
