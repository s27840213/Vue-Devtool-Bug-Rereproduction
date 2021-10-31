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
    div(class="category-fonts__icon")
      svg-icon(v-if="props.font === item.id && !pending"
        iconName="done"
        iconColor="gray-2"
        iconWidth="25px")
      svg-icon(v-else-if="pending"
        iconName="loading"
        iconColor="gray-1"
        iconWidth="20px")
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
  data() {
    return {
      pending: false
    }
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
      if (!fontStore.some(font => font.face === this.item.id)) {
        this.pending = true
        const newFont = new FontFace(this.item.id, this.getFontUrl(this.item.id))
        const promise = () => {
          return new Promise<void>((resolve) => {
            newFont.load().then(newFont => {
              document.fonts.add(newFont)
              TextUtils.updateFontFace({ name: newFont.family, face: newFont.family })
              StepsUtils.record()
              this.pending = false
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
    &__icon {
      position: absolute;
      right: 0;
    }
  }
</style>
